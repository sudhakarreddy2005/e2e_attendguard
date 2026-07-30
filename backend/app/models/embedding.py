"""
Face embedding document model.

Stored separately from student documents to:
  1. Keep student queries fast (no loading 512-float arrays)
  2. Support multiple embeddings per student
  3. Allow model retraining without touching student records
  4. Track embedding quality and provenance
"""

from typing import Optional

from pydantic import Field

from app.models.base import DocumentBase


class FaceEmbeddingDocument(DocumentBase):
    """MongoDB document model for the face_embeddings collection."""
    student_id: str  # roll_no reference
    embedding: list[float] = Field(default_factory=list)
    embedding_dimension: int = 512

    # Model provenance
    embedding_model: str = "arcface"
    model_version: str = "buffalo_l"

    # Quality metrics
    quality_score: float = 0.0
    blur_score: float = 0.0
    lighting_score: float = 0.0
    capture_angle: Optional[str] = None  # frontal | left | right | up | down

    # Source image reference
    image_path: Optional[str] = None
    image_filename: Optional[str] = None

    # Flags
    is_primary: bool = False  # The averaged / best embedding for matching
