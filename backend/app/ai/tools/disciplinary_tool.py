"""
Disciplinary AI Tool — Deterministic database query engine for institutional disciplinary queries.

Answers questions strictly using live MongoDB data:
  - "Show students who crossed Level 1 / Level 2"
  - "Show students pending Level 3 notification"
  - "Who received disciplinary emails this semester?"
  - "Generate the semester disciplinary report"
  - "Show notification history for student 23BQ1A05A9"
  - "List students approaching escalation"
"""

import re
from typing import Any, Dict, List, Optional

from app.ai.tools.base import BaseAITool
from app.repositories.notification_history_repository import notification_history_repo
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo
from app.services.discipline_config_service import discipline_config_service


class DisciplinaryTool(BaseAITool):
    name = "DisciplinaryTool"
    description = "Query institutional disciplinary escalation history, level crossings, semester reports, and recipient logs directly from MongoDB."

    async def run(self, query: str = "", **kwargs) -> Dict[str, Any]:
        """Execute deterministic database query based on user prompt."""
        q_lower = query.lower().strip()
        config = await discipline_config_service.get_config()
        academic_year = config.get("current_academic_year", "2025-2026")
        semester = config.get("current_semester", "3-1")

        l1_thresh = int(config.get("threshold_level_1", 5))
        l2_thresh = int(config.get("threshold_level_2", 10))
        l3_thresh = int(config.get("threshold_level_3", 15))

        # Check for specific student roll number query (e.g. 23BQ1A05A9)
        roll_match = re.search(r"\b([0-9]{2}[A-Z0-9]{8,10})\b", query.upper())
        if roll_match:
            target_roll = roll_match.group(1)
            history = await notification_history_repo.get_history_by_student(target_roll)
            student = await student_repo.find_by_roll_no(target_roll)
            violations = await violation_repo.find_by_student_and_semester(target_roll, academic_year, semester)

            return {
                "success": True,
                "query_type": "student_history",
                "roll_number": target_roll,
                "student_name": student.get("name") if student else "Unknown Student",
                "current_semester": semester,
                "academic_year": academic_year,
                "semester_violation_count": len(violations) or (student.get("violations_count", 0) if student else 0),
                "history_records": history,
            }

        # Query Type 1: Received emails this semester
        if "who received" in q_lower or "email history" in q_lower or "sent email" in q_lower or "sent email" in q_lower:
            records = await notification_history_repo.get_semester_notifications(academic_year, semester)
            return {
                "success": True,
                "query_type": "received_emails",
                "academic_year": academic_year,
                "semester": semester,
                "total_sent": len(records),
                "notifications": records,
            }

        # Query Type 2: Level 1 crossed
        if "level 1" in q_lower or "level-1" in q_lower:
            history_l1 = await notification_history_repo.get_students_by_level(academic_year, semester, 1)
            # Also find students with >= 5 violations in DB
            all_students = await student_repo.find_many({"violations_count": {"$gte": l1_thresh}})
            return {
                "success": True,
                "query_type": "level_1_students",
                "academic_year": academic_year,
                "semester": semester,
                "threshold": l1_thresh,
                "notified_count": len(history_l1),
                "notified_students": history_l1,
                "total_eligible_students": len(all_students),
                "students": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count", 0)} for s in all_students],
            }

        # Query Type 3: Level 2 crossed
        if "level 2" in q_lower or "level-2" in q_lower:
            history_l2 = await notification_history_repo.get_students_by_level(academic_year, semester, 2)
            all_students = await student_repo.find_many({"violations_count": {"$gte": l2_thresh}})
            return {
                "success": True,
                "query_type": "level_2_students",
                "academic_year": academic_year,
                "semester": semester,
                "threshold": l2_thresh,
                "notified_count": len(history_l2),
                "notified_students": history_l2,
                "total_eligible_students": len(all_students),
                "students": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count", 0)} for s in all_students],
            }

        # Query Type 4: Pending Level 3 or Level 3 crossed
        if "pending level 3" in q_lower or "level 3" in q_lower or "level-3" in q_lower:
            history_l3 = await notification_history_repo.get_students_by_level(academic_year, semester, 3)
            sent_rolls = {h["roll_number"] for h in history_l3}

            # Students who have >= 15 violations or are near 15 (10-14)
            high_violators = await student_repo.find_many({"violations_count": {"$gte": l2_thresh}})
            pending = [s for s in high_violators if s["roll_no"] not in sent_rolls and s.get("violations_count", 0) >= l3_thresh]

            return {
                "success": True,
                "query_type": "level_3_students",
                "academic_year": academic_year,
                "semester": semester,
                "threshold": l3_thresh,
                "notified_count": len(history_l3),
                "notified_students": history_l3,
                "pending_count": len(pending),
                "pending_students": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count", 0)} for s in pending],
            }

        # Query Type 5: Approaching escalation
        if "approaching" in q_lower or "near escalation" in q_lower or "at risk" in q_lower:
            near_l1 = await student_repo.find_many({"violations_count": {"$in": [l1_thresh - 1, l1_thresh - 2]}})
            near_l2 = await student_repo.find_many({"violations_count": {"$in": [l2_thresh - 1, l2_thresh - 2]}})
            near_l3 = await student_repo.find_many({"violations_count": {"$in": [l3_thresh - 1, l3_thresh - 2]}})

            return {
                "success": True,
                "query_type": "approaching_escalation",
                "academic_year": academic_year,
                "semester": semester,
                "approaching_level_1": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count")} for s in near_l1],
                "approaching_level_2": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count")} for s in near_l2],
                "approaching_level_3": [{"roll_no": s["roll_no"], "name": s.get("name"), "violations": s.get("violations_count")} for s in near_l3],
            }

        # Query Type 6: Full Semester Disciplinary Report
        all_history = await notification_history_repo.get_semester_notifications(academic_year, semester)
        l1_count = len([h for h in all_history if h.get("notification_level") == 1])
        l2_count = len([h for h in all_history if h.get("notification_level") == 2])
        l3_count = len([h for h in all_history if h.get("notification_level") == 3])

        return {
            "success": True,
            "query_type": "semester_disciplinary_report",
            "academic_year": academic_year,
            "semester": semester,
            "config_thresholds": {"level_1": l1_thresh, "level_2": l2_thresh, "level_3": l3_thresh},
            "total_notifications_sent": len(all_history),
            "level_1_advisories": l1_count,
            "level_2_warnings": l2_count,
            "level_3_escalations": l3_count,
            "notification_logs": all_history[:20],
        }


# Singleton instance
disciplinary_tool = DisciplinaryTool()
