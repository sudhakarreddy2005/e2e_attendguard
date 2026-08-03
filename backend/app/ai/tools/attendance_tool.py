"""
Attendance Tool — Query student attendance stats, bunk counts, and risk profiles.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.student_repository import student_repo


class AttendanceTool(BaseAITool):
    name = "AttendanceTool"
    description = "Retrieve attendance statistics, bunk counts, student profiles, and attendance risk levels."

    async def run(
        self,
        student_id: Optional[str] = None,
        department: Optional[str] = None,
        min_bunk_count: Optional[int] = None,
        sort_direction: Optional[str] = "desc",
        limit: Optional[int] = 10,
        **kwargs,
    ) -> Dict[str, Any]:
        """Execute attendance analysis tool."""
        if student_id:
            student = await student_repo.find_by_student_id(student_id)
            if not student:
                return {"success": False, "message": f"Student ID '{student_id}' not found in GuardDB records."}
            return {
                "success": True,
                "type": "single_student",
                "student": {
                    "student_id": student.get("student_id"),
                    "name": student.get("name"),
                    "department": student.get("dept"),
                    "year": student.get("year"),
                    "section": student.get("section"),
                    "bunk_count": student.get("bunk_count", 0),
                    "status": student.get("status"),
                    "risk_level": "HIGH" if student.get("bunk_count", 0) >= 3 else ("MEDIUM" if student.get("bunk_count", 0) >= 1 else "LOW"),
                },
            }

        query = {}
        if department:
            query["dept"] = department.upper()
        if min_bunk_count is not None:
            query["bunk_count"] = {"$gte": min_bunk_count}

        sort_order = 1 if sort_direction == "asc" else -1
        max_limit = limit or 10
        students = await student_repo.find_many(query, sort=[("bunk_count", sort_order)], limit=max_limit)
        total_count = await student_repo.count(query)

        high_risk = [s for s in students if s.get("bunk_count", 0) >= 3]

        return {
            "success": True,
            "type": "summary_list",
            "total_records": total_count,
            "filter_department": department,
            "sort_direction": sort_direction,
            "limit": max_limit,
            "high_risk_count": len(high_risk),
            "students": [
                {
                    "student_id": s.get("student_id"),
                    "name": s.get("name"),
                    "dept": s.get("dept"),
                    "bunk_count": s.get("bunk_count", 0),
                }
                for s in students
            ],
        }

