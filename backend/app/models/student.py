"""
Student document model.

Embeddings are NOT stored here — they live in the face_embeddings collection.
This keeps the student document lightweight for listing and search operations.
"""

from typing import Optional
from pydantic import BaseModel, Field
from app.models.base import DocumentBase


class ContactInfo(BaseModel):
    """Nested contact information."""
    phone: str = ""
    email: str = ""


class FaceRegistration(BaseModel):
    """Face registration metadata (NOT the actual embedding)."""
    image_filenames: list[str] = Field(default_factory=list)
    registration_status: str = "pending_image"  # pending_image | processing | active | failed
    registered_at: Optional[str] = None
    image_count: int = 0


class StudentDocument(DocumentBase):
    """MongoDB document model for the students collection."""
    roll_no: str
    name: str
    department: str = "CSE"
    section: str = "A"
    year: str = ""
    semester: Optional[int] = None

    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    face: FaceRegistration = Field(default_factory=FaceRegistration)

    # Denormalized counters (updated atomically via $inc)
    violations_count: int = 0
    late_count: int = 0
    bunk_count: int = 0
    dress_code_count: int = 0
    attendance_percentage: float = 0.0

    # Flexible metadata for future fields
    metadata: dict = Field(default_factory=dict)
