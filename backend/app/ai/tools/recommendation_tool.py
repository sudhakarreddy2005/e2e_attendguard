"""
Recommendation Tool — Generates context-aware, data-backed administrative recommendations.
"""

from typing import Any, Dict, List, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.violation_repository import violation_repo
from app.repositories.student_repository import student_repo


class RecommendationTool(BaseAITool):
    name = "RecommendationTool"
    description = "Generate context-aware administrative action items based on current GuardDB data."

    async def run(self, department: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generate data-backed recommendations returning structured JSON ONLY."""
        high_risk_cnt = await student_repo.count({"bunk_count": {"$gte": 3}})
        tot_violations = await violation_repo.count()

        recommendations: List[str] = []

        if high_risk_cnt > 0:
            recommendations.append(f"Issue automated advisory alerts for {high_risk_cnt} repeat offenders with >= 3 bunks.")
        if tot_violations > 20:
            recommendations.append("Deploy targeted security patrols near high-frequency violation hotspots.")
        if department:
            recommendations.append(f"Schedule a departmental attendance audit meeting with the HOD of {department.upper()}.")

        if not recommendations:
            recommendations.append("Attendance levels are currently stable across departments. Maintain regular monitoring.")

        return {
            "success": True,
            "data_backed_recommendations": recommendations,
            "metrics": {
                "high_risk_count": high_risk_cnt,
                "total_violations": tot_violations,
            },
        }
