"""
FastAPI dependency injection for authentication and RBAC authorization.

Usage in route handlers:
    @router.get("/protected")
    async def protected_route(user: TokenPayload = Depends(require_auth)):
        ...

    @router.post("/super-admin-only")
    async def admin_route(user: TokenPayload = Depends(require_role(["super_admin"]))):
        ...
"""

from typing import Callable, Union, List
from fastapi import Depends, Header, HTTPException, status
from app.core.security import TokenPayload, decode_token, has_minimum_role


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


def require_role(roles: Union[str, List[str]]) -> Callable:
    """
    Dependency factory requiring user to possess an allowed role or minimum role level.

    Usage:
        Depends(require_role("super_admin"))
        Depends(require_role(["super_admin", "principal", "hod"]))
    """
    allowed_roles = [roles] if isinstance(roles, str) else roles

    async def _check_role(
        user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        # Super admin always has access
        if user.role == "super_admin":
            return user

        if user.role not in allowed_roles:
            # Fallback to minimum role check if single role passed
            if isinstance(roles, str) and has_minimum_role(user.role, roles):
                return user

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{user.role}'. Required: {allowed_roles}",
            )
        return user

    return _check_role
