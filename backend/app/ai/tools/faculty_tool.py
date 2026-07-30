"""
Faculty Tool — Fetch faculty directory, HOD details, and advisor assignments.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.user_repository import user_repo


class FacultyTool(BaseAITool):
    name = "FacultyTool"
    description = "Fetch faculty directory, HOD contact details, and department advisor assignments."

    async def run(
        self,
        department: Optional[str] = None,
        role: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Fetch faculty information returning structured JSON ONLY."""
        query = {"role": {"$in": ["faculty", "admin", "superadmin", "deo"]}}
        if department:
            query["dept"] = department.upper()
        if role:
            query["role"] = role.lower()

        users = await user_repo.find_many(query, limit=10)

        faculty_list = []
        for u in users:
            faculty_list.append({
                "email": u.get("email"),
                "name": u.get("name") or u.get("email", "").split("@")[0].title(),
                "role": u.get("role"),
                "department": u.get("dept") or "ALL",
            })

        return {
            "success": True,
            "count": len(faculty_list),
            "faculty": faculty_list,
        }
