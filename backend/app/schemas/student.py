"""Student request/response schemas."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateStudentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    roll_no: str = Field(..., min_length=1, max_length=20)
    department: str = Field(default="CSE", max_length=10)
    section: str = Field(default="A", max_length=5)
    year: str = Field(default="", max_length=20)
    phone: str = Field(default="", max_length=15)
    email: str = Field(default="", max_length=100)
    threshold: Optional[str] = "75"


class UpdateStudentRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    year: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    metadata: Optional[dict] = None


class StudentResponse(BaseModel):
    """Student data returned to the frontend."""
    id: str = Field(alias="_id", default="")
    roll_no: str = ""
    name: str = ""
    department: str = ""
    section: str = ""
    year: str = ""
    contact_info: dict = Field(default_factory=dict)
    face: dict = Field(default_factory=dict)
    violations_count: int = 0
    late_count: int = 0
    bunk_count: int = 0
    dress_code_count: int = 0
    attendance_percentage: float = 0.0
    status: str = "active"
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

    model_config = {"populate_by_name": True}


class StudentAnalyticsResponse(BaseModel):
    success: bool = True
    data: dict = Field(default_factory=dict)
