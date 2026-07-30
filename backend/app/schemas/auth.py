"""Authentication request/response schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    success: bool = True
    message: str = "Login successful"
    data: dict = Field(default_factory=dict)
    # data contains: access_token, refresh_token, role, username


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = Field(default="faculty", pattern="^(super_admin|principal|admin|faculty)$")
    display_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
