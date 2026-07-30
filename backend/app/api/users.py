"""
User Management & Administration API Endpoints (Super Admin Portal).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr

from app.api.deps import require_role, TokenPayload
from app.services.auth_service import AuthService
from app.repositories.common_repositories import audit_repo


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str  # super_admin | principal | hod | faculty | security | deo | student
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
    current_user: TokenPayload = Depends(require_role(["super_admin", "admin"])),
):
    """List all registered institutional users."""
    users = await AuthService.list_users(limit=limit, skip=skip)
    return {"success": True, "count": len(users), "data": users}


@router.post("/invite")
async def invite_user(
    request: InviteUserRequest,
    current_user: TokenPayload = Depends(require_role(["super_admin"])),
):
    """Invite/onboard an institutional user (@vvit.net). Restricted to Super Admin."""
    user_id = await AuthService.invite_user(
        email=request.email,
        role=request.role,
        name=request.name,
        department=request.department,
        designation=request.designation,
        invited_by=current_user.sub,
    )
    return {"success": True, "message": f"Invited {request.email} as {request.role}", "user_id": user_id}


@router.patch("/{user_email}/role")
async def update_user_role(
    user_email: str,
    request: UpdateRoleRequest,
    current_user: TokenPayload = Depends(require_role(["super_admin"])),
):
    """Update role of an existing user. Restricted to Super Admin."""
    await AuthService.update_user_role(
        target_email=user_email,
        new_role=request.role,
        updated_by=current_user.sub,
    )
    return {"success": True, "message": f"Updated role for {user_email} to {request.role}"}


@router.patch("/{user_email}/status")
async def toggle_user_status(
    user_email: str,
    request: ToggleStatusRequest,
    current_user: TokenPayload = Depends(require_role(["super_admin"])),
):
    """Enable or disable a user account. Restricted to Super Admin."""
    await AuthService.toggle_user_status(
        target_email=user_email,
        is_active=request.is_active,
        updated_by=current_user.sub,
    )
    return {"success": True, "message": f"Set active state for {user_email} to {request.is_active}"}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(default=50, le=200),
    current_user: TokenPayload = Depends(require_role(["super_admin", "principal"])),
):
    """View system & security audit trail logs."""
    logs = await audit_repo.get_recent(limit=limit)
    return {"success": True, "data": logs}
