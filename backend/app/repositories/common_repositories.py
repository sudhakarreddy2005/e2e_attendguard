"""Audit log, Admin, and general-purpose repositories."""

from typing import Optional

from app.database import collections as C
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository):
    collection_name = C.AUDIT_LOGS

    async def log_action(
        self,
        user: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        description: str = "",
        changes: Optional[dict] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        doc = {
            "user": user,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "description": description,
            "changes": changes or {},
            "ip_address": ip_address,
        }
        return await self.insert_one(doc)


class AdminRepository(BaseRepository):
    collection_name = C.ADMINS

    async def find_by_username(self, username: str) -> Optional[dict]:
        return await self.find_one({"username": username})


class ReportRepository(BaseRepository):
    collection_name = C.REPORTS

    async def find_recent(self, limit: int = 20) -> list[dict]:
        return await self.find_many(
            sort=[("created_at", -1)],
            limit=limit,
        )


class AttendanceRepository(BaseRepository):
    collection_name = C.ATTENDANCE_LOGS


class NotificationRepository(BaseRepository):
    collection_name = C.NOTIFICATIONS

    async def find_unread(self, user_id: str) -> list[dict]:
        return await self.find_many(
            {"user_id": user_id, "read": False},
            sort=[("created_at", -1)],
        )

    async def mark_read(self, notification_id: str) -> bool:
        from bson import ObjectId
        return await self.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}},
        )


class SettingsRepository(BaseRepository):
    collection_name = C.SETTINGS

    async def get_setting(self, key: str) -> Optional[dict]:
        return await self.find_one({"key": key})

    async def set_setting(self, key: str, value, description: str = "", category: str = "general") -> None:
        existing = await self.get_setting(key)
        if existing:
            await self.update_one({"key": key}, {"$set": {"value": value}})
        else:
            await self.insert_one({
                "key": key,
                "value": value,
                "description": description,
                "category": category,
            })


class NotificationAuditRepository(BaseRepository):
    collection_name = getattr(C, "NOTIFICATION_AUDIT", "notification_audit")

    async def log_attempt(
        self,
        student_id: str,
        recipient: str,
        mode: str,
        status: str,
        provider_response: Optional[dict] = None,
        error_message: Optional[str] = None,
        correlation_id: Optional[str] = None,
        retry_count: int = 0,
        timestamp: Optional[float] = None,
    ) -> str:
        doc = {
            "timestamp": timestamp or __import__("time").time(),
            "student_id": student_id,
            "recipient": recipient,
            "mode": mode,
            "status": status,
            "provider_response": provider_response or {},
            "error_message": error_message,
            "correlation_id": correlation_id or f"corr_{__import__('uuid').uuid4().hex[:8]}",
            "retry_count": retry_count,
        }
        return await self.insert_one(doc)


# Singleton instances
audit_repo = AuditLogRepository()
admin_repo = AdminRepository()
report_repo = ReportRepository()
attendance_repo = AttendanceRepository()
notification_repo = NotificationRepository()
notification_audit_repo = NotificationAuditRepository()
settings_repo = SettingsRepository()

