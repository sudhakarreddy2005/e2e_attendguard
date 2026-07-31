"""
User Management & Administration API Endpoints (Super Admin Portal).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import require_permission, TokenPayload
from app.services.auth_service import AuthService
from app.repositories.common_repositories import audit_repo
from app.repositories.user_repository import user_repo


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str  # SUPER_ADMIN | PRINCIPAL | HOD | DEO | SECURITY | STUDENT
    name: Optional[str] = ""
    department: Optional[str] = ""
    designation: Optional[str] = ""


class UpdateRoleRequest(BaseModel):
    role: str


class ToggleStatusRequest(BaseModel):
    is_active: bool


router = APIRouter(prefix="/api/users", tags=["User Management"])


@router.get("/")
async def list_users(
    limit: int = Query(default=100, le=500),
    skip: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(require_permission("users.manage")),
):
    """List all registered institutional users."""
    users = await AuthService.list_users(limit=limit, skip=skip)
    return {"success": True, "count": len(users), "data": users}


@router.post("/invite")
async def invite_user(
    request: InviteUserRequest,
    current_user: TokenPayload = Depends(require_permission("users.manage")),
):
    """Invite/onboard an institutional user (@vvit.net)."""
    user_id = await AuthService.invite_user(
        email=request.email,
        role=request.role.upper(),
        name=request.name,
        department=request.department,
        designation=request.designation,
        invited_by=current_user.sub,
    )
    return {"success": True, "message": f"Invited {request.email} as {request.role.upper()}", "user_id": user_id}


@router.patch("/{user_email}/role")
async def update_user_role(
    user_email: str,
    request: UpdateRoleRequest,
    current_user: TokenPayload = Depends(require_permission("users.manage")),
):
    """Update role of an existing user."""
    await AuthService.update_user_role(
        target_email=user_email,
        new_role=request.role.upper(),
        updated_by=current_user.sub,
    )
    return {"success": True, "message": f"Updated role for {user_email} to {request.role.upper()}"}


@router.patch("/{user_email}/status")
async def toggle_user_status(
    user_email: str,
    request: ToggleStatusRequest,
    current_user: TokenPayload = Depends(require_permission("users.manage")),
):
    """Enable or disable a user account."""
    await AuthService.toggle_user_status(
        target_email=user_email,
        is_active=request.is_active,
        updated_by=current_user.sub,
    )
    return {"success": True, "message": f"Set active state for {user_email} to {request.is_active}"}


@router.delete("/{user_email}")
async def delete_user(
    user_email: str,
    current_user: TokenPayload = Depends(require_permission("users.manage")),
):
    """Delete a user account."""
    target_clean = user_email.lower().strip()
    if target_clean == current_user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account",
        )

    deleted = await user_repo.delete_one({"email": target_clean})
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_email}' not found",
        )

    await audit_repo.log_action(
        user=current_user.sub,
        action="user_deleted",
        entity_type="user",
        description=f"Deleted user account '{target_clean}'",
    )
    return {"success": True, "message": f"User {user_email} deleted successfully"}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(default=50, le=200),
    current_user: TokenPayload = Depends(require_permission("audit.view")),
):
    """View system & security audit trail logs."""
    logs = await audit_repo.get_recent(limit=limit)
    return {"success": True, "data": logs}
