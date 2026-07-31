"""
JWT token management, password hashing, and permission verification.

Supported 6 Roles: SUPER_ADMIN, PRINCIPAL, HOD, DEO, SECURITY, STUDENT.
Authorization is driven by granular DB permissions embedded in JWTs.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, List

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

# ── 6 Production IAM Roles ────────────────────────────────────────────────
PRODUCTION_ROLES = {
    "SUPER_ADMIN",
    "PRINCIPAL",
    "HOD",
    "DEO",
    "SECURITY",
    "STUDENT",
}

VALID_ROLES = PRODUCTION_ROLES


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str  # user email
    role: str
    exp: datetime
    iat: datetime
    token_type: str = "access"
    email: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    permissions: List[str] = []


# ── Password Hashing ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)


# ── JWT Token Creation ────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    department: Optional[str] = None,
    permissions: Optional[List[str]] = None,
) -> str:
    """Create a JWT access token with embedded permissions."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))

    payload = {
        "sub": subject,
        "role": role.upper(),
        "exp": expire,
        "iat": now,
        "token_type": "access",
        "email": email or subject,
        "name": name or subject.split("@")[0],
        "department": department or "General",
        "permissions": permissions or [],
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT refresh token with longer expiry."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS))

    payload = {
        "sub": subject,
        "role": role.upper(),
        "exp": expire,
        "iat": now,
        "token_type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate a JWT token. Returns None if invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return TokenPayload(**payload)
    except JWTError:
        return None


# ── Permission Verification ──────────────────────────────────────────────

def user_has_permission(user_permissions: List[str], required_permission: str) -> bool:
    """
    Check if required_permission exists in user_permissions.
    Supports wildcard '*' for unrestricted Super Admin permissions.
    """
    if "*" in user_permissions:
        return True
    return required_permission in user_permissions
