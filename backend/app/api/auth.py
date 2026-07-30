"""
Authentication API Endpoints.
"""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional

from app.api.deps import require_auth
from app.core.security import TokenPayload
from app.services.auth_service import AuthService


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(description="Google OpenID Connect ID token")


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/google")
async def google_login(request_body: GoogleLoginRequest, request: Request):
    """Authenticate or auto-provision institutional user via Google OAuth 2.0."""
    client_ip = request.client.host if request.client else None
    result = await AuthService.google_sso_login(request_body.id_token, ip_address=client_ip)
    return {"success": True, "data": result}


@router.post("/login")
async def login(request: LoginRequest):
    """Local IT Administrator login fallback."""
    result = await AuthService.login(request.username, request.password)
    return {"success": True, "data": result}


@router.post("/refresh")
async def refresh(request: RefreshRequest):
    """Refresh JWT access token."""
    result = await AuthService.refresh_access_token(request.refresh_token)
    return {"success": True, "data": result}


@router.get("/me")
async def get_current_user_profile(user: TokenPayload = Depends(require_auth)):
    """Get profile of currently logged-in user."""
    return {
        "success": True,
        "data": {
            "sub": user.sub,
            "username": user.sub,
            "role": user.role,
        },
    }
