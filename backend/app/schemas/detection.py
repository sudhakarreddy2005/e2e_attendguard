"""Detection / Recognition response schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class FaceMatch(BaseModel):
    """A single matched face result."""
    roll_no: str = ""
    name: str = ""
    department: str = ""
    section: str = ""
    confidence: float = 0.0
    distance: float = 0.0
    violations_count: int = 0


class DetectionResponse(BaseModel):
    """Response from the face recognition endpoint."""
    success: bool = True
    matched: bool = False
    student: Optional[FaceMatch] = None
    matches: list[FaceMatch] = Field(default_factory=list)

    # Diagnostics
    faces_detected: int = 0
    distance: Optional[float] = None
    threshold: float = 0.0
    reason: str = ""
    captured_filename: Optional[str] = None

    # Processing stats
    detection_ms: Optional[float] = None
    recognition_ms: Optional[float] = None
    total_ms: Optional[float] = None
