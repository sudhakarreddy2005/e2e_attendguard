"""
Base repository with common CRUD operations.

All repositories inherit from this and get standard
create, find, update, delete operations for free.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from app.database.connection import get_database
from app.core.logging import get_logger, LOGGER_DATABASE

logger = get_logger(LOGGER_DATABASE)


class BaseRepository:
    """Generic async MongoDB repository."""

    collection_name: str = ""

    @property
    def collection(self):
        return get_database()[self.collection_name]

    async def find_one(self, query: dict) -> Optional[dict]:
        """Find a single document."""
        doc = await self.collection.find_one(query)
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def find_by_id(self, doc_id: str) -> Optional[dict]:
        """Find a document by its ObjectId."""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None

    async def find_many(
        self,
        query: Optional[dict] = None,
        sort: Optional[list] = None,
        skip: int = 0,
        limit: int = 0,
        projection: Optional[dict] = None,
    ) -> list[dict]:
        """Find multiple documents with optional sort, skip, limit."""
        cursor = self.collection.find(query or {}, projection)
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)

        docs = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            docs.append(doc)
        return docs

    async def count(self, query: Optional[dict] = None) -> int:
        """Count documents matching query."""
        return await self.collection.count_documents(query or {})

    async def insert_one(self, document: dict) -> str:
        """Insert a document and return its string ID."""
        now = datetime.now(timezone.utc)
        document.setdefault("created_at", now)
        document.setdefault("updated_at", now)
        document.setdefault("status", "active")
        document.setdefault("version", 1)

        result = await self.collection.insert_one(document)
        return str(result.inserted_id)

    async def update_one(self, query: dict, update: dict) -> bool:
        """Update a single document. Automatically sets updated_at."""
        if "$set" in update:
            update["$set"]["updated_at"] = datetime.now(timezone.utc)
        else:
            update.setdefault("$set", {})["updated_at"] = datetime.now(timezone.utc)

        result = await self.collection.update_one(query, update)
        return result.modified_count > 0

    async def delete_one(self, query: dict) -> bool:
        """Delete a single document."""
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0

    async def aggregate(self, pipeline: list) -> list[dict]:
        """Run an aggregation pipeline."""
        docs = []
        async for doc in self.collection.aggregate(pipeline):
            if "_id" in doc and isinstance(doc["_id"], ObjectId):
                doc["_id"] = str(doc["_id"])
            docs.append(doc)
        return docs
