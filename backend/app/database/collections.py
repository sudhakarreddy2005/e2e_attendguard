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
NOTIFICATIONS = "notifications"
ANALYTICS_CACHE = "analytics_cache"

ALL_COLLECTIONS = [
    USERS,
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
    ANALYTICS_CACHE,
]
