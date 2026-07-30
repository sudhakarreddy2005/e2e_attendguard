"""
Notification Tool — Prepares advisory notification alerts for parents/HODs.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.student_repository import student_repo


class NotificationTool(BaseAITool):
    name = "NotificationTool"
    description = "Draft automated advisory notices, email notifications, and warning alerts for high-risk students."

    async def run(
        self,
        student_id: Optional[str] = None,
        recipient_role: str = "advisor",
        **kwargs,
    ) -> Dict[str, Any]:
        """Draft notification returning structured JSON ONLY."""
        student = None
        if student_id:
            student = await student_repo.find_by_id(student_id)

        student_name = student.get("name") if student else "Student"
        bunks = student.get("bunk_count", 0) if student else 0

        subject = f"AttendGuard Academic Notice: Attendance Alert for {student_name}"
        message = (
            f"Dear {recipient_role.title()},\n\n"
            f"This is an automated attendance notice regarding student {student_name} (ID: {student_id or 'N/A'}).\n"
            f"The student has accumulated {bunks} recorded bunks, crossing the institutional risk threshold.\n"
            f"Please schedule an advisory meeting at your earliest convenience."
        )

        return {
            "success": True,
            "recipient_role": recipient_role,
            "subject": subject,
            "message_body": message,
            "status": "DRAFT_CREATED",
        }
