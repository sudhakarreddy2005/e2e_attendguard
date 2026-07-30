from app.models.base import DocumentBase
from app.models.user import UserDocument, UserRole
from app.models.student import StudentDocument
from app.models.violation import ViolationDocument
from app.models.attendance import AttendanceLogDocument
from app.models.embedding import FaceEmbeddingDocument
from app.models.common import (
    ReportDocument,
    AdminDocument,
    NotificationDocument,
    AuditLogDocument,
    DepartmentDocument,
    SettingsDocument,
    AnalyticsCacheDocument,
)

__all__ = [
    "DocumentBase",
    "UserDocument",
    "UserRole",
    "StudentDocument",
    "ViolationDocument",
    "AttendanceLogDocument",
    "FaceEmbeddingDocument",
    "ReportDocument",
    "AdminDocument",
    "NotificationDocument",
    "AuditLogDocument",
    "DepartmentDocument",
    "SettingsDocument",
    "AnalyticsCacheDocument",
]
