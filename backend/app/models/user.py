"""
Institutional User document model and RBAC role definitions.
"""

from enum import Enum
from typing import Optional
from pydantic import Field
from app.models.base import DocumentBase


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # Full system control & admin management
    PRINCIPAL = "principal"      # Campus-wide executive reports & analytics
    HOD = "hod"                  # Department analytics & faculty supervision
    FACULTY = "faculty"          # Attendance, student records, reports
    SECURITY = "security"        # Live gate recognition & incident logging
    DEO = "deo"                  # Data Entry Operator (student registration)
    STUDENT = "student"          # Self-service view of own attendance/violations


class UserDocument(DocumentBase):
    """Institutional User Account collection ('users')."""
    user_id: str = Field(description="Unique email or roll_no identifier")
    email: str = Field(description="Institutional email (e.g. 23BQ1A05A9@vvit.net)")
    name: str = ""
    role: UserRole = UserRole.FACULTY
    
    # Provider & Security
    auth_provider: str = "google"  # google | saml | entra | local
    google_id: Optional[str] = None
    password_hash: Optional[str] = None  # Optional fallback for local IT admin
    
    # Institutional Metadata
    department: Optional[str] = None  # CSE | ECE | EEE | MECH | CIVIL
    designation: Optional[str] = None  # Professor | Assistant Professor | Gate Guard | Operator
    employee_id: Optional[str] = None
    student_roll: Optional[str] = None
    profile_photo: Optional[str] = None
    
    # State & Audit
    is_active: bool = True
    status: str = "active"  # active | suspended | pending_invite
    last_login: Optional[str] = None
    last_login_ip: Optional[str] = None
    login_count: int = 0
