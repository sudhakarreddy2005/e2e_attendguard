"""Student repository — data access for the students collection."""

from typing import Optional

from app.database import collections as C
from app.repositories.base import BaseRepository


class StudentRepository(BaseRepository):
    collection_name = C.STUDENTS

    async def find_by_roll_no(self, roll_no: str) -> Optional[dict]:
        clean_roll = roll_no.upper().strip()
        alt_roll = clean_roll.replace("0", "O") if "0" in clean_roll else clean_roll.replace("O", "0")
        email_pattern = f"{clean_roll.lower()}@vvit.net"

        query = {
            "$or": [
                {"roll_no": clean_roll},
                {"roll_no": alt_roll},
                {"contact_info.email": email_pattern},
                {"email": email_pattern},
                {"roll_no": {"$regex": f"^{clean_roll}$", "$options": "i"}},
            ]
        }
        return await self.find_one(query)

    async def find_by_department_section(
        self, department: str, section: Optional[str] = None
    ) -> list[dict]:
        query: dict = {"department": department.upper()}
        if section:
            query["section"] = section.upper()
        return await self.find_many(query)

    async def find_with_embeddings(
        self, department: Optional[str] = None, section: Optional[str] = None
    ) -> list[dict]:
        """Find students that have active face registrations."""
        query: dict = {"face.registration_status": "active"}
        if department:
            query["department"] = department.upper()
        if section:
            query["section"] = section.upper()
        return await self.find_many(query)

    async def increment_violation(self, roll_no: str, violation_type: str) -> bool:
        """Atomically increment violation counters."""
        inc_data: dict = {"violations_count": 1}

        v_lower = violation_type.lower()
        if "late" in v_lower:
            inc_data["late_count"] = 1
        elif "bunk" in v_lower:
            inc_data["bunk_count"] = 1
        elif "dress" in v_lower:
            inc_data["dress_code_count"] = 1

        return await self.update_one(
            {"roll_no": roll_no},
            {"$inc": inc_data},
        )

    async def decrement_violation(self, roll_no: str, violation_type: str) -> bool:
        """Atomically decrement violation counters (on violation delete)."""
        inc_data: dict = {"violations_count": -1}

        v_lower = violation_type.lower()
        if "late" in v_lower:
            inc_data["late_count"] = -1
        elif "bunk" in v_lower:
            inc_data["bunk_count"] = -1
        elif "dress" in v_lower:
            inc_data["dress_code_count"] = -1

        return await self.update_one(
            {"roll_no": roll_no},
            {"$inc": inc_data},
        )

    async def search(self, query_text: str, limit: int = 20) -> list[dict]:
        """Simple text search on name and roll_no."""
        regex_query = {"$regex": query_text, "$options": "i"}
        return await self.find_many(
            {"$or": [{"name": regex_query}, {"roll_no": regex_query}]},
            limit=limit,
        )


# Singleton instance
student_repo = StudentRepository()
