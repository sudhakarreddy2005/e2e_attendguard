"""Violation API endpoints."""

from fastapi import APIRouter, Depends

from app.api.deps import require_auth, require_role
from app.core.security import TokenPayload
from app.services.violation_service import ViolationService

router = APIRouter(prefix="/api/violations", tags=["Violations"])


@router.post("/")
async def create_violation(
    data: dict,
    user: TokenPayload = Depends(require_auth),
):
    violation_id = await ViolationService.create_violation(data, created_by=user.sub)
    return {"success": True, "id": violation_id}


@router.get("/")
async def get_violations(user: TokenPayload = Depends(require_auth)):
    violations = await ViolationService.get_violations()
    return violations


@router.delete("/{violation_id}")
async def delete_violation(
    violation_id: str,
    user: TokenPayload = Depends(require_role("admin")),
):
    success = await ViolationService.delete_violation(violation_id, deleted_by=user.sub)
    if success:
        return {"success": True}
    return {"success": False, "error": "Violation not found"}


@router.patch("/{violation_id}/status")
async def update_violation_status(
    violation_id: str,
    data: dict,
    user: TokenPayload = Depends(require_auth),
):
    await ViolationService.update_violation_status(
        violation_id=violation_id,
        status=data.get("status", "Resolved"),
        reviewed_by=user.sub,
    )
    return {"success": True, "message": "Status updated"}
