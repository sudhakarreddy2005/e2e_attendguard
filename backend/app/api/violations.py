"""Violation API endpoints."""

from fastapi import APIRouter, Depends

from app.api.deps import require_permission
from app.core.security import TokenPayload
from app.services.violation_service import ViolationService

router = APIRouter(prefix="/api/violations", tags=["Violations"])


@router.post("/")
async def create_violation(
    data: dict,
    user: TokenPayload = Depends(require_permission("violations.manage")),
):
    violation_id = await ViolationService.create_violation(data, created_by=user.sub)
    return {"success": True, "id": violation_id}


@router.get("/")
async def get_violations(
    user: TokenPayload = Depends(require_permission("violations.view")),
):
    violations = await ViolationService.get_violations()
    if user.role.upper() == "HOD" and user.department:
        target_dept = user.department.upper().strip()
        violations = [
            v for v in violations
            if v.get("department", "").upper().strip() == target_dept
        ]
    return violations


@router.delete("/{violation_id}")
async def delete_violation(
    violation_id: str,
    user: TokenPayload = Depends(require_permission("violations.manage")),
):
    success = await ViolationService.delete_violation(violation_id, deleted_by=user.sub)
    if success:
        return {"success": True}
    return {"success": False, "error": "Violation not found"}


@router.patch("/{violation_id}/status")
async def update_violation_status(
    violation_id: str,
    data: dict,
    user: TokenPayload = Depends(require_permission("violations.manage")),
):
    await ViolationService.update_violation_status(
        violation_id=violation_id,
        status=data.get("status", "Resolved"),
        reviewed_by=user.sub,
    )
    return {"success": True, "message": "Status updated"}
