"""
Vision Explanation Tool — Explain face recognition thresholds, distance metrics, and detection parameters.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.core.config import settings


class VisionTool(BaseAITool):
    name = "VisionTool"
    description = "Explain face recognition detection metrics, embedding threshold algorithms, distance formulas, and vision pipeline logs."

    async def run(
        self,
        distance: Optional[float] = None,
        confidence: Optional[float] = None,
        faces_detected: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Explain vision recognition parameter or result."""
        threshold = float(getattr(settings, "FACE_DISTANCE_THRESHOLD", 0.45))

        explanation = (
            f"AttendGuard Computer Vision Pipeline Mechanics:\n"
            f"• **Embedding Architecture**: InsightFace (ResNet) / 128D facial feature vectors\n"
            f"• **Matching Criterion**: L2 Euclidean Distance against registered student embeddings\n"
            f"• **Configured Match Threshold**: {threshold}\n"
        )

        if distance is not None:
            is_match = distance <= threshold
            calc_confidence = max(0.0, round((1.0 - distance) * 100, 2))
            explanation += (
                f"\nAnalysis for Provided Sample:\n"
                f"- Measured Distance: {distance:.4f}\n"
                f"- Evaluated Match Status: {'MATCH CONFIRMED' if is_match else 'NO MATCH (UNKNOWN FACE)'}\n"
                f"- Calculated Identity Confidence: {calc_confidence}%\n"
            )

        if faces_detected is not None:
            explanation += f"\n- Multi-Face Detection: Processing {faces_detected} detected bounding boxes in frame.\n"

        return {
            "success": True,
            "threshold": threshold,
            "distance": distance,
            "confidence": confidence,
            "explanation": explanation,
        }
