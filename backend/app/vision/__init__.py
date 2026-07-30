"""
Vision package — Computer Vision pipeline for AttendGuard 3.0.

Pipeline: Image → Preprocess → Detect (RetinaFace) → Align → Embed (ArcFace) → Match (Cosine)

Components:
    preprocessor : Image quality assessment and enhancement
    detector     : RetinaFace face detection with landmarks
    aligner      : Affine alignment to canonical face
    similarity   : Cosine similarity matching engine
    pipeline     : Orchestrates the full recognition flow
"""

from app.vision.preprocessor import preprocessor
from app.vision.detector import detector
from app.vision.aligner import aligner
from app.vision.similarity import similarity_engine
from app.vision.pipeline import recognition_pipeline

__all__ = [
    "preprocessor",
    "detector",
    "aligner",
    "similarity_engine",
    "recognition_pipeline",
]
