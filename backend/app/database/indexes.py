"""
Database index definitions and initialization.

Creates indexes for all collections on application startup.
Indexes are idempotent — running this multiple times is safe.
"""

from pymongo import ASCENDING, DESCENDING, IndexModel

from app.core.logging import get_logger, LOGGER_DATABASE
from app.database.connection import get_database
from app.database import collections as C

logger = get_logger(LOGGER_DATABASE)


async def create_indexes() -> None:
    """Create all database indexes. Called on app startup after DB connection."""
    db = get_database()

    logger.info("Creating database indexes...")

    # ── Students ──────────────────────────────────────────────────────
    await db[C.STUDENTS].create_indexes([
        IndexModel([("roll_no", ASCENDING)], unique=True),
        IndexModel([("department", ASCENDING)]),
        IndexModel([("section", ASCENDING)]),
        IndexModel([("department", ASCENDING), ("section", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("name", ASCENDING)]),
    ])

    # ── Face Embeddings ───────────────────────────────────────────────
    await db[C.FACE_EMBEDDINGS].create_indexes([
        IndexModel([("student_id", ASCENDING)]),
        IndexModel([("student_id", ASCENDING), ("is_primary", DESCENDING)]),
        IndexModel([("model_version", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
    ])

    # ── Attendance Logs ───────────────────────────────────────────────
    await db[C.ATTENDANCE_LOGS].create_indexes([
        IndexModel([("student_id", ASCENDING)]),
        IndexModel([("date", ASCENDING)]),
        IndexModel([("department", ASCENDING), ("date", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
    ])

    # ── Violations ────────────────────────────────────────────────────
    await db[C.VIOLATIONS].create_indexes([
        IndexModel([("roll_no", ASCENDING)]),
        IndexModel([("type", ASCENDING)]),
        IndexModel([("location", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("department", ASCENDING)]),
        IndexModel([("department", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # ── Reports ───────────────────────────────────────────────────────
    await db[C.REPORTS].create_indexes([
        IndexModel([("report_type", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("created_by", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
    ])

    # ── Users (Institutional SSO Accounts) ────────────────────────────
    await db[C.USERS].create_indexes([
        IndexModel([("email", ASCENDING)], unique=True, sparse=True),
        IndexModel([("google_id", ASCENDING)], sparse=True),
        IndexModel([("role", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
    ])

    # ── Admins (Legacy) ──────────────────────────────────────────────
    await db[C.ADMINS].create_indexes([
        IndexModel([("username", ASCENDING)], unique=True),
        IndexModel([("role", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
    ])

    # ── Departments ───────────────────────────────────────────────────
    await db[C.DEPARTMENTS].create_indexes([
        IndexModel([("code", ASCENDING)], unique=True),
        IndexModel([("status", ASCENDING)]),
    ])

    # ── Audit Logs ────────────────────────────────────────────────────
    await db[C.AUDIT_LOGS].create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("user", ASCENDING)]),
        IndexModel([("action", ASCENDING)]),
        IndexModel([("entity_type", ASCENDING), ("entity_id", ASCENDING)]),
    ])

    # ── Notifications ─────────────────────────────────────────────────
    await db[C.NOTIFICATIONS].create_indexes([
        IndexModel([("user_id", ASCENDING), ("read", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
    ])

    # ── Analytics Cache ───────────────────────────────────────────────
    await db[C.ANALYTICS_CACHE].create_indexes([
        IndexModel([("cache_key", ASCENDING)], unique=True),
        IndexModel([("expires_at", ASCENDING)]),
    ])

    # ── Settings ──────────────────────────────────────────────────────
    await db[C.SETTINGS].create_indexes([
        IndexModel([("key", ASCENDING)], unique=True),
    ])

    logger.info("All database indexes created successfully")


async def drop_stale_indexes() -> None:
    """Remove indexes from old schema that may conflict."""
    db = get_database()
    stale = ["student_id_1"]
    for idx_name in stale:
        try:
            await db[C.STUDENTS].drop_index(idx_name)
            logger.info("Dropped stale index: %s", idx_name)
        except Exception:
            pass  # Index doesn't exist — safe to ignore
