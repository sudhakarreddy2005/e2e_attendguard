"""
FastAPI dependency injection for authentication and DB-driven permission authorization.

Usage in route handlers:
    @router.get("/protected")
    async def protected_route(user: TokenPayload = Depends(require_auth)):
        ...

    @router.get("/students")
    async def get_students(user: TokenPayload = Depends(require_permission("students.view"))):
        ...
"""

from typing import Callable, Union, List
from fastapi import Depends, Header, HTTPException, status
from app.core.security import TokenPayload, decode_token, user_has_permission


async def get_current_user(
    authorization: str = Header(None),
) -> TokenPayload:
    """Extract and validate JWT from the Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
        )

    token = parts[1]
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return payload


require_auth = get_current_user


def require_permission(required_permission: str) -> Callable:
    """
    Dependency factory requiring user to possess a specific DB-driven permission.

    Usage:
        Depends(require_permission("students.view"))
        Depends(require_permission("recognition.scan"))
    """

    async def _check_permission(
        user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        # SUPER_ADMIN or '*' permission always bypasses checks
        if user.role.upper() == "SUPER_ADMIN" or "*" in (user.permissions or []):
            return user

        if not user_has_permission(user.permissions or [], required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: '{required_permission}'",
            )
        return user

    return _check_permission


def require_role(roles: Union[str, List[str]]) -> Callable:
    """
    Legacy role check wrapper for backwards compatibility.
    Checks permissions internally or matches role name.
    """
    allowed_roles = [r.upper() for r in ([roles] if isinstance(roles, str) else roles)]

    async def _check_role(
        user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        if user.role.upper() == "SUPER_ADMIN" or user.role.upper() in allowed_roles:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for role '{user.role}'. Required: {allowed_roles}",
        )

    return _check_role
