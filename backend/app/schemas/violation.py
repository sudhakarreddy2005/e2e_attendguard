"""Violation request/response schemas."""

from typing import Optional

from pydantic import BaseModel, Field

ALLOWED_VIOLATION_TYPES = {"Late Arrival", "Dress Code", "Bunk"}
ALLOWED_LOCATIONS = {
    "A Block", "B Block", "C Block", "D Block",
    "U Block", "Central Block", "Playground",
}
ALLOWED_STATUSES = {"Pending", "Reviewed", "Resolved", "Escalated"}


class CreateViolationRequest(BaseModel):
    roll_no: str = Field(..., min_length=1)
    type: str = Field(...)
    location: str = Field(...)
    department: str = Field(default="")
    section: str = Field(default="")
    remarks: str = Field(default="")
    status: str = Field(default="Pending")
    confidence: Optional[float] = None
    captured_image: Optional[str] = None
    detection_method: str = "manual"


class UpdateViolationRequest(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    reviewed_by: Optional[str] = None


class ViolationResponse(BaseModel):
    id: str = Field(alias="_id", default="")
    roll_no: str = ""
    student_name: str = ""
    type: str = ""
    location: str = ""
    department: str = ""
    section: str = ""
    remarks: str = ""
    status: str = "Pending"
    confidence: Optional[float] = None
    date: str = ""
    iso_date: str = ""
    created_at: Optional[str] = None

    model_config = {"populate_by_name": True}
