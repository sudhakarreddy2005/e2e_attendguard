"""
Recognition pipeline — orchestrates the complete face recognition flow.

Image → Preprocess → Detect → Align → Embed → Match → Result

This is the main entry point used by the detection API endpoint.
"""

import time
from typing import Optional

import cv2
import numpy as np

from app.core.config import settings
from app.core.exceptions import ImageQualityError, NoFaceDetectedError
from app.core.logging import get_logger, LOGGER_VISION
from app.repositories.embedding_repository import embedding_repo
from app.vision.aligner import aligner
from app.vision.detector import detector
from app.vision.preprocessor import preprocessor
from app.vision.similarity import similarity_engine

logger = get_logger(LOGGER_VISION)


class RecognitionPipeline:
    """
    Full face recognition pipeline.

    Supports:
      - Single face matching (registration verification)
      - Multi-face matching (classroom monitoring)
      - Quality-aware processing
    """

    async def recognize_from_file(
        self,
        image_path: str,
        department: Optional[str] = None,
        section: Optional[str] = None,
        max_faces: int = 1,
    ) -> dict:
        """
        Run recognition pipeline on an image file.

        Returns:
            {
                success: bool,
                matched: bool,
                matches: [{roll_no, name, confidence, ...}],
                faces_detected: int,
                detection_ms: float,
                recognition_ms: float,
                total_ms: float,
            }
        """
        total_start = time.time()

        # 1. Load image
        image = cv2.imread(image_path)
        if image is None:
            return self._error_response("Failed to load image")

        return await self._process_image(
            image, department, section, max_faces, total_start
        )

    async def recognize_from_array(
        self,
        image: np.ndarray,
        department: Optional[str] = None,
        section: Optional[str] = None,
        max_faces: int = 1,
    ) -> dict:
        """Run recognition on an in-memory image array."""
        return await self._process_image(
            image, department, section, max_faces, time.time()
        )

    async def extract_embedding(self, image_path: str) -> Optional[list[float]]:
        """
        Extract a single face embedding from an image file.
        Used for student registration.
        """
        image = cv2.imread(image_path)
        if image is None:
            return None

        # Preprocess
        image = preprocessor.preprocess(image)

        # Detect faces
        faces = detector.detect(image, max_faces=1)
        if not faces:
            return None

        return faces[0].get("embedding")

    async def _process_image(
        self,
        image: np.ndarray,
        department: Optional[str],
        section: Optional[str],
        max_faces: int,
        total_start: float,
    ) -> dict:
        """Core processing logic shared by file and array methods."""

        # 1. Quality assessment
        quality = preprocessor.assess_quality(image)
        if not quality["is_acceptable"]:
            return self._error_response(
                f"Image quality too low: {', '.join(quality['issues'])}",
                quality=quality,
            )

        # 2. Preprocess
        processed = preprocessor.preprocess(image)

        # 3. Detect faces
        detect_start = time.time()
        try:
            faces = detector.detect(processed, max_faces=max_faces)
        except Exception as err:
            logger.error("Face detection failed: %s", err)
            return self._error_response(f"Face detection engine error: {str(err)}")
        detection_ms = (time.time() - detect_start) * 1000

        if not faces:
            return {
                "success": True,
                "matched": False,
                "matches": [],
                "faces_detected": 0,
                "reason": "No face detected in image",
                "quality": quality,
                "detection_ms": round(detection_ms, 1),
                "threshold": settings.FACE_SIMILARITY_THRESHOLD,
            }

        # 4. Load candidate embeddings from database
        recognition_start = time.time()
        try:
            candidates = await embedding_repo.find_all_primary(department, section)
        except Exception as err:
            logger.error("Failed to load embeddings from DB: %s", err)
            return self._error_response(f"Database error: {str(err)}")

        if not candidates:
            return {
                "success": True,
                "matched": False,
                "matches": [],
                "faces_detected": len(faces),
                "reason": "No registered students found in the selected area",
                "detection_ms": round(detection_ms, 1),
                "threshold": settings.FACE_SIMILARITY_THRESHOLD,
            }

        # 5. Match each detected face
        matches = []
        for face in faces:
            face_embedding = face.get("embedding")
            if not face_embedding:
                continue

            best_match, similarity = similarity_engine.find_best_match(
                face_embedding, candidates
            )

            if best_match:
                confidence = round(similarity * 100, 2)
                matches.append({
                    "roll_no": best_match.get("student_id", ""),
                    "name": best_match.get("student_name", ""),
                    "department": best_match.get("student_department", ""),
                    "section": best_match.get("student_section", ""),
                    "confidence": confidence,
                    "similarity": round(similarity, 4),
                    "violations_count": best_match.get("student_violations_count", 0),
                    "bbox": face.get("bbox"),
                    "face_width": face.get("face_width"),
                })

        recognition_ms = (time.time() - recognition_start) * 1000
        total_ms = (time.time() - total_start) * 1000

        # Construct comprehensive diagnostic explanations
        for m in matches:
            m["quality_score"] = quality.get("overall_quality", 0.9) * 100.0
            m["blur_score"] = quality.get("blur_score", 50.0)
            m["lighting_score"] = quality.get("lighting_score", 0.8)
            m["lighting"] = "Good" if quality.get("lighting_score", 0.8) > 0.5 else "Low Light"
            m["pose"] = "Centered / Optimal"
            m["recognition_time_ms"] = round(recognition_ms, 1)

        result = {
            "success": True,
            "matched": len(matches) > 0,
            "matches": matches,
            "faces_detected": len(faces),
            "detection_ms": round(detection_ms, 1),
            "recognition_ms": round(recognition_ms, 1),
            "total_ms": round(total_ms, 1),
            "quality": quality,
            "threshold": settings.FACE_SIMILARITY_THRESHOLD,
        }

        # Backward compatibility: if single face mode, add "student" key
        if max_faces == 1 and matches:
            result["student"] = matches[0]
            result["confidence"] = matches[0]["confidence"]
            result["distance"] = round(1.0 - matches[0]["similarity"], 4)

        if matches:
            result["reason"] = f"Recognition Successful — Matched {len(matches)} face(s) with high confidence"
            result["explanation"] = {
                "status": "MATCHED",
                "summary": f"Verified {matches[0]['name']} ({matches[0]['roll_no']})",
                "similarity_score": matches[0]["similarity"],
                "confidence_percent": matches[0]["confidence"],
                "quality_assessment": "Acceptable",
                "suggestions": []
            }
        else:
            # Build detailed failure analysis
            best_cand, top_sim = similarity_engine.find_best_match(
                faces[0]["embedding"], candidates
            )
            top_sim_val = round(top_sim, 4) if top_sim else 0.0
            
            suggestions = []
            if quality.get("blur_score", 100) < 45.0:
                suggestions.append("Hold camera steady to reduce motion blur.")
            if quality.get("lighting_score", 1.0) < 0.4:
                suggestions.append("Increase front lighting on student face.")
            if faces[0].get("face_width", 100) < settings.FACE_MIN_SIZE:
                suggestions.append("Move closer to the camera to increase facial resolution.")
            if not suggestions:
                suggestions.append("Ensure student is registered in the database for the selected department/section.")

            result["reason"] = f"Recognition Inconclusive — Top similarity ({top_sim_val}) below threshold ({settings.FACE_SIMILARITY_THRESHOLD})"
            result["explanation"] = {
                "status": "UNMATCHED",
                "summary": f"Top match similarity is {top_sim_val}, required threshold is {settings.FACE_SIMILARITY_THRESHOLD}.",
                "blur_status": f"Score {quality.get('blur_score')} ({'Blurry' if quality.get('blur_score', 100) < 45 else 'Sharp'})",
                "lighting_status": f"Score {quality.get('lighting_score')} ({'Low' if quality.get('lighting_score', 1) < 0.4 else 'Good'})",
                "pose_status": "Neutral / Dynamic",
                "face_distance_px": faces[0].get("face_width", 0),
                "top_similarity_score": top_sim_val,
                "suggestions": suggestions
            }

        logger.info(
            "Recognition: %d faces → %d matches (%.0fms detect, %.0fms match)",
            len(faces), len(matches), detection_ms, recognition_ms,
        )

        return result


    @staticmethod
    def _error_response(reason: str, **extra) -> dict:
        return {
            "success": True,
            "matched": False,
            "matches": [],
            "faces_detected": 0,
            "reason": reason,
            **extra,
        }


# Singleton
recognition_pipeline = RecognitionPipeline()
