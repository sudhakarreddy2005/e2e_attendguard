"""
Face detector using InsightFace's RetinaFace model.

Provides face detection with landmark extraction.
Supports multi-face detection for classroom images.
Auto-selects GPU (CUDA) if available, falls back to CPU.
"""

import threading
from typing import Optional

import cv2
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger, LOGGER_VISION

logger = get_logger(LOGGER_VISION)

_lock = threading.Lock()
_model = None


def _get_provider() -> list[str]:
    """Auto-detect GPU availability and return ONNX provider list."""
    try:
        import onnxruntime as ort
        available = ort.get_available_providers()
        if "CUDAExecutionProvider" in available:
            logger.info("CUDA GPU detected — using GPU acceleration")
            return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    except Exception:
        pass
    logger.info("Using CPU for inference")
    return ["CPUExecutionProvider"]


def _load_model():
    """Load InsightFace model (singleton pattern with thread safety)."""
    global _model
    if _model is not None:
        return _model

    with _lock:
        if _model is not None:
            return _model

        try:
            from insightface.app import FaceAnalysis

            providers = _get_provider()
            model = FaceAnalysis(
                name=settings.EMBEDDING_MODEL,
                providers=providers,
            )
            model.prepare(ctx_id=0, det_size=(640, 640))
            _model = model
            logger.info(
                "InsightFace model loaded: %s (det_size=640x640)",
                settings.EMBEDDING_MODEL,
            )
            return _model
        except Exception as e:
            logger.error("Failed to load InsightFace model: %s", str(e))
            raise


class FaceDetector:
    """
    Face detection using RetinaFace via InsightFace.

    Features:
      - Multi-face detection
      - Landmark extraction (5 points: left eye, right eye, nose, left mouth, right mouth)
      - Confidence scoring
      - Face size validation
    """

    def __init__(self, min_face_size: int = None):
        self.min_face_size = min_face_size or settings.FACE_MIN_SIZE

    def detect(self, image: np.ndarray, max_faces: int = None) -> list[dict]:
        """
        Detect faces in an image.

        Returns a list of face dicts, each containing:
          - bbox: [x1, y1, x2, y2]
          - landmarks: 5x2 array of facial landmarks
          - confidence: detection confidence score
          - embedding: 512-D face embedding
          - face_width: width of the bounding box
        """
        max_faces = max_faces or settings.RECOGNITION_MAX_FACES
        model = _load_model()

        faces = model.get(image)

        if not faces:
            return []

        results = []
        for face in faces[:max_faces]:
            bbox = face.bbox.astype(int).tolist()
            face_width = bbox[2] - bbox[0]

            # Skip faces that are too small
            if face_width < self.min_face_size:
                logger.debug(
                    "Skipping small face: %dpx < %dpx minimum",
                    face_width, self.min_face_size,
                )
                continue

            result = {
                "bbox": bbox,
                "landmarks": face.kps.tolist() if face.kps is not None else None,
                "confidence": float(face.det_score) if hasattr(face, "det_score") else 0.0,
                "embedding": face.normed_embedding.tolist() if face.normed_embedding is not None else None,
                "face_width": face_width,
                "face_height": bbox[3] - bbox[1],
            }
            results.append(result)

        # Sort by confidence (highest first)
        results.sort(key=lambda x: x["confidence"], reverse=True)

        logger.info("Detected %d faces (from %d total)", len(results), len(faces))
        return results


# Singleton
detector = FaceDetector()
