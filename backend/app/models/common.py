"""Report, Admin, Notification, and Audit document models."""

from typing import Any, Optional

from pydantic import Field

from app.models.base import DocumentBase


class ReportDocument(DocumentBase):
    """Generated reports (AI or manual)."""
    report_type: str = ""  # daily | weekly | monthly | semester | department | faculty | principal
    title: str = ""
    content: str = ""  # Markdown content
    summary: str = ""

    # Scope
    department: Optional[str] = None
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None

    # Generation
    created_by: str = ""  # username or "ai"
    generation_method: str = "manual"  # manual | ai
    ai_model: Optional[str] = None
    file_path: Optional[str] = None  # path to exported PDF/Excel

    # Data snapshot used to generate the report
    data_snapshot: dict = Field(default_factory=dict)


class AdminDocument(DocumentBase):
    """User accounts with role-based access."""
    username: str
    password_hash: str
    role: str = "faculty"  # super_admin | principal | admin | faculty

    # Profile
    display_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None

    # Session
    last_login: Optional[str] = None
    login_count: int = 0


class NotificationDocument(DocumentBase):
    """In-app notifications."""
    user_id: str  # target username
    title: str = ""
    message: str = ""
    type: str = "info"  # info | warning | success | error | ai_recommendation

    # State
    read: bool = False
    read_at: Optional[str] = None

    # Link context
    action_url: Optional[str] = None
    entity_type: Optional[str] = None  # student | violation | report
    entity_id: Optional[str] = None


class AuditLogDocument(DocumentBase):
    """Immutable audit trail for all significant actions."""
    user: str = ""  # username
    action: str = ""  # create | update | delete | login | export | recognize
    entity_type: str = ""  # student | violation | report | settings | user
    entity_id: Optional[str] = None

    # Change details
    description: str = ""
    changes: dict = Field(default_factory=dict)  # {field: {old: x, new: y}}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class DepartmentDocument(DocumentBase):
    """Department configuration."""
    code: str  # CSE, ECE, EEE, MECH, CIVIL
    name: str = ""
    head: Optional[str] = None
    sections: list[str] = Field(default_factory=lambda: ["A", "B"])
    student_count: int = 0


class SettingsDocument(DocumentBase):
    """Key-value system settings."""
    key: str
    value: Any = None
    description: str = ""
    category: str = "general"  # general | recognition | ai | notifications | security


class AnalyticsCacheDocument(DocumentBase):
    """Pre-computed analytics for fast dashboard loading."""
    cache_key: str
    data: dict = Field(default_factory=dict)
    expires_at: Optional[str] = None
    computed_at: Optional[str] = None
