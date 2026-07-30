"""Violation repository — data access for the violations collection."""

from typing import Optional

from app.database import collections as C
from app.repositories.base import BaseRepository


class ViolationRepository(BaseRepository):
    collection_name = C.VIOLATIONS

    async def find_with_student_names(self, filters: Optional[dict] = None) -> list[dict]:
        """Get violations with student names via $lookup aggregation."""
        pipeline = []
        if filters:
            pipeline.append({"$match": filters})

        pipeline.extend([
            {
                "$lookup": {
                    "from": C.STUDENTS,
                    "localField": "roll_no",
                    "foreignField": "roll_no",
                    "as": "student_info",
                }
            },
            {
                "$unwind": {
                    "path": "$student_info",
                    "preserveNullAndEmptyArrays": True,
                }
            },
            {
                "$addFields": {
                    "student_name": {
                        "$ifNull": ["$student_info.name", "Unknown Student"]
                    }
                }
            },
            {"$project": {"student_info": 0}},
            {"$sort": {"created_at": -1}},
        ])

        return await self.aggregate(pipeline)

    async def find_by_roll_no(self, roll_no: str) -> list[dict]:
        return await self.find_many(
            {"roll_no": roll_no},
            sort=[("created_at", -1)],
        )

    async def find_today(self) -> list[dict]:
        from datetime import datetime, time, timezone
        today_start = datetime.combine(
            datetime.now(timezone.utc).date(), time.min
        ).replace(tzinfo=timezone.utc)
        return await self.find_many({"created_at": {"$gte": today_start}})

    async def count_today(self) -> int:
        from datetime import datetime, time, timezone
        today_start = datetime.combine(
            datetime.now(timezone.utc).date(), time.min
        ).replace(tzinfo=timezone.utc)
        return await self.count({"created_at": {"$gte": today_start}})


    async def delete_by_student(self, roll_no: str) -> int:
        """Delete all violations logged for a student."""
        result = await self.collection.delete_many({"roll_no": roll_no.upper()})
        return result.deleted_count


# Singleton instance
violation_repo = ViolationRepository()
