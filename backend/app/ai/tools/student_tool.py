"""
Student Tool — Search student profile, history, and status.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo


class StudentTool(BaseAITool):
    name = "StudentTool"
    description = "Fetch student profile, history, department, section, contact, and bunk status."

    async def run(
        self,
        student_id: Optional[str] = None,
        name: Optional[str] = None,
        department: Optional[str] = None,
        section: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Fetch student details returning structured JSON ONLY."""
        query = {}
        if student_id:
            query["student_id"] = {"$regex": student_id, "$options": "i"}
        if name:
            query["name"] = {"$regex": name, "$options": "i"}
        if department:
            query["dept"] = department.upper()
        if section:
            query["section"] = section.upper()

        students = await student_repo.find_many(query, limit=10)
        
        result_students = []
        for s in students:
            # Fetch recent violations for student if ID present
            s_id = s.get("student_id")
            v_count = 0
            if s_id:
                v_count = await violation_repo.count({"student_id": s_id})

            result_students.append({
                "student_id": s.get("student_id"),
                "name": s.get("name"),
                "department": s.get("dept"),
                "section": s.get("section"),
                "year": s.get("year"),
                "bunk_count": s.get("bunk_count", 0),
                "total_violations": v_count,
                "status": "HIGH_RISK" if s.get("bunk_count", 0) >= 3 else "NORMAL",
            })

        return {
            "success": True,
            "count": len(result_students),
            "students": result_students,
        }
