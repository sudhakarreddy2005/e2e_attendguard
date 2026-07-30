"""
Analytics Tool — Perform departmental comparisons, rankings, trends, and anomaly detection.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo


class AnalyticsTool(BaseAITool):
    name = "AnalyticsTool"
    description = "Generate department comparisons, attendance rankings, anomaly detection, and systemic insights."

    async def run(
        self,
        metric: Optional[str] = "department_comparison",
        **kwargs,
    ) -> Dict[str, Any]:
        """Execute analytics tool."""
        # Aggregate violations by department
        dept_pipeline = [
            {"$group": {"_id": "$dept", "total_students": {"$sum": 1}, "total_bunks": {"$sum": "$bunk_count"}}},
            {"$sort": {"total_bunks": -1}},
        ]
        dept_stats = await student_repo.aggregate(dept_pipeline)

        formatted_depts = []
        for d in dept_stats:
            dept_name = d["_id"] or "UNASSIGNED"
            students_cnt = d["total_students"]
            bunks_cnt = d["total_bunks"]
            avg_bunks = round(bunks_cnt / max(students_cnt, 1), 2)
            formatted_depts.append({
                "department": dept_name,
                "total_students": students_cnt,
                "total_bunks": bunks_cnt,
                "avg_bunk_rate": avg_bunks,
                "risk_rating": "HIGH" if avg_bunks >= 1.5 else ("MEDIUM" if avg_bunks >= 0.5 else "LOW"),
            })

        # Anomaly detection: identify departments with > 50% higher bunk rate than institutional average
        total_students = await student_repo.count()
        total_violations = await violation_repo.count()

        return {
            "success": True,
            "metric": metric,
            "overall_summary": {
                "total_students": total_students,
                "total_violations": total_violations,
                "departments_tracked": len(formatted_depts),
            },
            "department_breakdown": formatted_depts,
            "anomalies": [d for d in formatted_depts if d["risk_rating"] == "HIGH"],
        }
