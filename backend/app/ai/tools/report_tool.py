"""
Report Tool — Generate executive markdown reports with structured sections and actionable insights.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo


class ReportTool(BaseAITool):
    name = "ReportTool"
    description = "Compile executive-quality reports with summaries, key metrics, risk assessments, and recommendations."

    async def run(
        self,
        report_type: str = "executive_summary",
        department: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate structured executive report."""
        total_students = await student_repo.count({"dept": department.upper()} if department else {})
        total_violations = await violation_repo.count()

        # High risk students
        high_risk = await student_repo.find_many({"bunk_count": {"$gte": 3}}, limit=10)

        markdown_report = (
            f"# 🎓 ATTENDGUARD EXECUTIVE ATTENDANCE & VIOLATION REPORT\n"
            f"**Report Scope**: {department if department else 'All Campus Departments'}\n\n"
            f"## 📊 Executive Summary\n"
            f"- **Enrolled Student Population**: {total_students}\n"
            f"- **Total Confirmed Incident Logs**: {total_violations}\n"
            f"- **Identified High-Risk Repeat Offenders**: {len(high_risk)}\n\n"
            f"## ⚠️ High-Risk Repeat Offenders (>= 3 Bunks)\n"
        )

        if high_risk:
            for s in high_risk:
                markdown_report += f"- **{s.get('name')}** (`{s.get('student_id')}`) — Dept: {s.get('dept')} | Bunks: {s.get('bunk_count')}\n"
        else:
            markdown_report += "_No repeat offenders currently flagged in GuardDB._\n"

        markdown_report += (
            f"\n## 🛡️ Strategic AI Recommendations\n"
            f"1. **Targeted Patrols**: Increase campus security surveillance near primary violation hotspots.\n"
            f"2. **Automated Advisory**: Trigger mandatory parent/advisor notifications for students exceeding 3 bunks.\n"
            f"3. **Departmental Audit**: Review class schedules and laboratory attendance logs for high-bunk departments.\n"
        )

        return {
            "success": True,
            "report_type": report_type,
            "markdown_content": markdown_report,
            "metrics": {
                "total_students": total_students,
                "total_violations": total_violations,
                "high_risk_count": len(high_risk),
            },
        }
