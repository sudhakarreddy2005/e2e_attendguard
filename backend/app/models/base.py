"""
Base model with common fields shared by all MongoDB documents.

Every document in the system includes:
  - created_at: Timestamp of creation
  - updated_at: Timestamp of last modification
  - status: Document lifecycle state
  - version: Schema version for migration support
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


class DocumentBase(BaseModel):
    """Fields present in every MongoDB document."""
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    status: str = "active"
    version: int = 1

    model_config = {"populate_by_name": True}
