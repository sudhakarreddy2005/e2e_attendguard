"""Search, Settings, and Notifications API endpoints."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_auth, require_role
from app.core.security import TokenPayload
from app.services.student_service import StudentService
from app.repositories.common_repositories import notification_repo, settings_repo

# ── Search ────────────────────────────────────────────────────────────────
search_router = APIRouter(prefix="/api/search", tags=["Search"])


@search_router.get("/")
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    user: TokenPayload = Depends(require_auth),
):
    """Global fuzzy search across students."""
    students = await StudentService.search_students(q, limit=20)
    return {"success": True, "data": {"students": students}}


# ── Settings ──────────────────────────────────────────────────────────────
settings_router = APIRouter(prefix="/api/settings", tags=["Settings"])


@settings_router.get("/")
async def get_settings(user: TokenPayload = Depends(require_role("admin"))):
    all_settings = await settings_repo.find_many()
    return {"success": True, "data": all_settings}


@settings_router.put("/{key}")
async def update_setting(
    key: str,
    data: dict,
    user: TokenPayload = Depends(require_role("admin")),
):
    await settings_repo.set_setting(key, data.get("value"), data.get("description", ""))
    return {"success": True, "message": f"Setting '{key}' updated"}


# ── Notifications ─────────────────────────────────────────────────────────
notifications_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@notifications_router.get("/")
async def get_notifications(user: TokenPayload = Depends(require_auth)):
    notifications = await notification_repo.find_unread(user.sub)
    return {"success": True, "data": notifications}


@notifications_router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: TokenPayload = Depends(require_auth),
):
    await notification_repo.mark_read(notification_id)
    return {"success": True}
