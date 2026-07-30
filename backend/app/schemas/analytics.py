"""Report, Search, and Analytics schemas."""

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Reports ───────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    report_type: str = "daily"  # daily | weekly | monthly | semester | department | faculty | principal
    department: Optional[str] = None
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    format: str = "json"  # json | pdf | csv | excel


class ReportResponse(BaseModel):
    success: bool = True
    data: dict = Field(default_factory=dict)
    total: int = 0
    breakdown: list = Field(default_factory=list)


# ── AI Search ─────────────────────────────────────────────────────────────

class AISearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    context: Optional[str] = None  # page context for better results


class AISearchResponse(BaseModel):
    success: bool = True
    query: str = ""
    response: str = ""  # Markdown formatted
    data: Optional[Any] = None
    suggested_prompts: list[str] = Field(default_factory=list)
    processing_time_ms: Optional[float] = None


class AIConversationMessage(BaseModel):
    role: str = "user"  # user | assistant
    content: str = ""
    timestamp: Optional[str] = None


# ── Analytics ─────────────────────────────────────────────────────────────

class DashboardKPIs(BaseModel):
    total_students: int = 0
    total_violations: int = 0
    today_activity: int = 0
    recognition_accuracy: float = 0.0
    unknown_faces_today: int = 0
    monthly_chart: dict = Field(default_factory=dict)
    most_active_location: dict = Field(default_factory=dict)
    dept_breakdown: dict = Field(default_factory=dict)
    type_breakdown: dict = Field(default_factory=dict)
    recent_activity: list = Field(default_factory=list)
    weekly_trends: dict = Field(default_factory=dict)
