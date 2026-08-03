"""
MongoDB Repository for AI Copilot chat sessions and messages.
"""

from typing import Any, Dict, List, Optional
from app.database.connection import get_database
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository):
    collection_name = "chat_sessions"

    async def get_or_create_session(self, session_id: str, user_id: str, user_role: str = "faculty") -> Dict[str, Any]:
        session = await self.find_one({"session_id": session_id})
        if not session:
            session = {
                "session_id": session_id,
                "user_id": user_id,
                "user_role": user_role,
                "title": "Campus Intelligence Session",
                "active": True,
                "named_entities": {},
                "pending_tasks": [],
                "metadata": {},
            }
            await self.insert_one(session)
        return session

    async def add_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None,
        tools_executed: Optional[List[str]] = None,
        structured_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        db = get_database()
        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "intent": intent,
            "tools_executed": tools_executed or [],
            "structured_data": structured_data or {},
        }
        res = await db["chat_messages"].insert_one(doc)
        return str(res.inserted_id)

    async def get_recent_messages(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db["chat_messages"].find({"session_id": session_id}).sort("_id", -1).limit(limit)
        messages = await cursor.to_list(length=limit)
        messages.reverse()
        return messages

    async def get_session_summary(self, session_id: str) -> Optional[str]:
        db = get_database()
        doc = await db["conversation_summaries"].find_one({"session_id": session_id})
        return doc.get("summary_text") if doc else None

    async def save_session_summary(self, session_id: str, user_id: str, summary_text: str, key_topics: List[str]) -> None:
        db = get_database()
        await db["conversation_summaries"].update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "session_id": session_id,
                    "user_id": user_id,
                    "summary_text": summary_text,
                    "key_topics": key_topics,
                }
            },
            upsert=True,
        )


chat_repo = ChatRepository()
