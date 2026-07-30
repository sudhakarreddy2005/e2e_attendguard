"""
JWT token management and password hashing.

Supports 4 roles: super_admin, principal, faculty, admin.
Role hierarchy: super_admin > principal > admin > faculty.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings


# ── Institutional Role Hierarchy ──────────────────────────────────────────
ROLE_HIERARCHY = {
    "super_admin": 7,
    "principal": 6,
    "hod": 5,
    "admin": 4,
    "faculty": 3,
    "security": 2,
    "deo": 2,
    "student": 1,
}

VALID_ROLES = set(ROLE_HIERARCHY.keys())


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str  # username
    role: str
    exp: datetime
    iat: datetime
    token_type: str = "access"


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
) -> str:
    """Create a JWT access token."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))

    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": now,
        "token_type": "access",
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
        "role": role,
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


# ── Role Checks ───────────────────────────────────────────────────────────

def has_minimum_role(user_role: str, required_role: str) -> bool:
    """Check if user_role meets or exceeds the required_role in hierarchy."""
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 0)
    return user_level >= required_level
