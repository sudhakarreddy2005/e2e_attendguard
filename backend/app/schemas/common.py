"""
Common response schemas used across all API endpoints.
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    success: bool = False
    error: dict = Field(default_factory=lambda: {"code": "UNKNOWN", "message": "Unknown error"})


class PaginatedResponse(BaseModel):
    """Paginated list response."""
    success: bool = True
    data: list = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str = ""
    database: str = "connected"
