"""Embedding repository — data access for the face_embeddings collection."""

from typing import Optional

from app.database import collections as C
from app.repositories.base import BaseRepository


class EmbeddingRepository(BaseRepository):
    collection_name = C.FACE_EMBEDDINGS

    async def find_by_student(self, student_id: str) -> list[dict]:
        return await self.find_many({"student_id": student_id})

    async def find_primary(self, student_id: str) -> Optional[dict]:
        return await self.find_one({
            "student_id": student_id,
            "is_primary": True,
            "status": "active",
        })

    async def find_all_primary(
        self,
        department: Optional[str] = None,
        section: Optional[str] = None,
    ) -> list[dict]:
        """Get all primary embeddings, optionally filtered by dept/section.

        This performs a $lookup against students to filter by dept/section
        since embeddings don't store department directly.
        """
        dept_norm = department.upper() if department and department.upper() not in ('ALL', 'ALL DEPTS', 'ANY', 'NONE', '') else None
        sect_norm = section.upper() if section and section.upper() not in ('ALL', 'ALL SECTIONS', 'ANY', 'NONE', '') else None

        pipeline: list[dict] = [
            {"$match": {"is_primary": True, "status": "active"}},
            {
                "$lookup": {
                    "from": C.STUDENTS,
                    "localField": "student_id",
                    "foreignField": "roll_no",
                    "as": "student",
                }
            },
            {"$unwind": "$student"},
        ]

        student_match: dict = {}
        if dept_norm:
            student_match["student.department"] = {"$regex": f"^{dept_norm}$", "$options": "i"}
        if sect_norm:
            student_match["student.section"] = {"$regex": f"^{sect_norm}$", "$options": "i"}

        if student_match:
            pipeline.append({"$match": student_match})

        pipeline.extend([
            {
                "$addFields": {
                    "student_name": "$student.name",
                    "student_department": "$student.department",
                    "student_section": "$student.section",
                    "student_violations_count": "$student.violations_count",
                }
            },
            {"$project": {"student": 0}},
        ])

        return await self.aggregate(pipeline)

    async def delete_by_student(self, student_id: str) -> int:
        """Delete all embeddings for a student."""
        result = await self.collection.delete_many({"student_id": student_id})
        return result.deleted_count

    async def set_primary(self, student_id: str, embedding_id: str) -> None:
        """Set one embedding as primary, unset all others for this student."""
        from bson import ObjectId
        # Unset all
        await self.collection.update_many(
            {"student_id": student_id},
            {"$set": {"is_primary": False}},
        )
        # Set the one
        await self.collection.update_one(
            {"_id": ObjectId(embedding_id)},
            {"$set": {"is_primary": True}},
        )


# Singleton instance
embedding_repo = EmbeddingRepository()
