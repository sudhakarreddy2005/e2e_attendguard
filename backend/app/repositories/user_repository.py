"""
Repository for User collection ('users').
"""

from typing import Optional
from app.database.collections import USERS
from app.models.user import UserDocument
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    """User data access operations."""

    collection_name = USERS

    async def find_by_email(self, email: str) -> Optional[dict]:
        """Find user by institutional email address."""
        return await self.find_one({"email": email.lower().strip()})

    async def find_by_google_id(self, google_id: str) -> Optional[dict]:
        """Find user by Google sub identifier."""
        return await self.find_one({"google_id": google_id})


user_repo = UserRepository()
