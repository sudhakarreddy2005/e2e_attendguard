"""Attendance log document model."""

from datetime import date
from typing import Optional

from pydantic import Field

from app.models.base import DocumentBase


class AttendanceLogDocument(DocumentBase):
    """MongoDB document model for the attendance_logs collection."""
    student_id: str  # roll_no
    date: str = ""  # YYYY-MM-DD
    department: str = ""
    section: str = ""

    # Attendance data
    present: bool = False
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    period: Optional[str] = None  # 1st Hour, 2nd Hour, etc.

    # Recognition context
    recognition_confidence: Optional[float] = None
    detection_method: str = "manual"  # manual | automatic
