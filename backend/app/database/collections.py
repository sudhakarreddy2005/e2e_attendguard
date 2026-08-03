"""
MongoDB collection name constants and index definitions.

Centralizes all collection names to prevent typos and
defines indexes that are created on application startup.
"""

# ── Collection Name Constants ─────────────────────────────────────────────
USERS = "users"
STUDENTS = "students"
FACE_EMBEDDINGS = "face_embeddings"
ATTENDANCE_LOGS = "attendance_logs"
VIOLATIONS = "violations"
REPORTS = "reports"
ADMINS = "admins"
DEPARTMENTS = "departments"
SETTINGS = "settings"
AUDIT_LOGS = "audit_logs"
ROLES = "roles"
NOTIFICATIONS = "notifications"
NOTIFICATION_AUDIT = "notification_audit"
NOTIFICATION_HISTORY = "notification_history"
ANALYTICS_CACHE = "analytics_cache"

ALL_COLLECTIONS = [
    USERS,
    ROLES,
    STUDENTS,
    FACE_EMBEDDINGS,
    ATTENDANCE_LOGS,
    VIOLATIONS,
    REPORTS,
    ADMINS,
    DEPARTMENTS,
    SETTINGS,
    AUDIT_LOGS,
    NOTIFICATIONS,
    NOTIFICATION_AUDIT,
    NOTIFICATION_HISTORY,
    ANALYTICS_CACHE,
]



