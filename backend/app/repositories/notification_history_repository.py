"""
Notification History Repository — Data access for the notification_history collection.
"""

from typing import Any, Dict, List, Optional
from app.database import collections as C
from app.repositories.base import BaseRepository


class NotificationHistoryRepository(BaseRepository):
    collection_name = C.NOTIFICATION_HISTORY

    async def has_been_notified(
        self,
        roll_number: str,
        academic_year: str,
        semester: str,
        notification_level: int,
    ) -> bool:
        """
        Check if a student has already received a notification for a specific level,
        academic year, and semester (idempotency rule).
        """
        clean_roll = roll_number.strip().upper()
        query = {
            "roll_number": {"$regex": f"^{clean_roll}$", "$options": "i"},
            "academic_year": academic_year,
            "semester": semester,
            "notification_level": int(notification_level),
            "delivery_status": {"$in": ["SENT", "LIVE_SENT", "DRY_RUN_COMPLETED", "SHADOW_DISPATCHED"]},
        }
        existing = await self.find_one(query)
        return existing is not None

    async def log_notification(self, doc_dict: Dict[str, Any]) -> str:
        """Insert a completed notification audit record."""
        return await self.insert_one(doc_dict)

    async def get_history_by_student(
        self, roll_number: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieve all notification history entries for a specific student."""
        clean_roll = roll_number.strip().upper()
        return await self.find_many(
            {"roll_number": {"$regex": f"^{clean_roll}$", "$options": "i"}},
            sort=[("sent_at", -1)],
            limit=limit,
        )

    async def get_semester_notifications(
        self, academic_year: str, semester: str, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve all notifications sent during a specific academic year and semester."""
        return await self.find_many(
            {"academic_year": academic_year, "semester": semester},
            sort=[("sent_at", -1)],
            limit=limit,
        )

    async def get_students_by_level(
        self, academic_year: str, semester: str, notification_level: int
    ) -> List[Dict[str, Any]]:
        """Retrieve all students who received a specific notification level in a semester."""
        return await self.find_many(
            {
                "academic_year": academic_year,
                "semester": semester,
                "notification_level": int(notification_level),
            },
            sort=[("sent_at", -1)],
        )


# Singleton instance
notification_history_repo = NotificationHistoryRepository()
