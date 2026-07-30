"""Violation document model."""

from typing import Optional

from pydantic import Field

from app.models.base import DocumentBase


class ViolationDocument(DocumentBase):
    """MongoDB document model for the violations collection."""
    roll_no: str
    name: Optional[str] = None
    department: str = ""
    section: str = ""

    type: str  # Late Arrival | Dress Code | Bunk
    location: str = ""
    remarks: str = ""

    # Recognition context (if detected via camera)
    confidence: Optional[float] = None
    captured_image: Optional[str] = None
    detection_method: str = "manual"  # manual | automatic

    # Workflow
    # status inherited from DocumentBase: active → reviewed → resolved → escalated
    reviewed_by: Optional[str] = None
    resolved_at: Optional[str] = None
