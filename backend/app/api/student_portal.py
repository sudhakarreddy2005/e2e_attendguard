"""
Student Self-Service Portal API Router.

Strictly protects student data by extracting the roll number from the authenticated JWT.
Students can ONLY access their own profile, registered photo, department, section, and violation history.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_permission
from app.core.security import TokenPayload
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo

router = APIRouter(prefix="/student", tags=["Student Portal"])


def extract_roll_no_from_email(email: str) -> str:
    """Extract roll number from student email address (e.g. 23BQ1A05A9@vvit.net -> 23BQ1A05A9)."""
    if not email:
        return ""
    username = email.split("@")[0]
    return username.upper().strip()


@router.get("/me", response_model=Dict[str, Any])
async def get_student_profile(
    current_user: TokenPayload = Depends(require_permission("student.self")),
):
    """
    Get student profile details for the logged-in student.
    Roll number derived strictly from JWT email.
    """
    roll_no = extract_roll_no_from_email(current_user.email or current_user.sub)
    if not roll_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine student roll number from authenticated session",
        )

    student = await student_repo.find_by_roll_no(roll_no)
    if not student:
        # Return structured fallback if student document hasn't been added to students collection yet
        return {
            "success": True,
            "data": {
                "roll_no": roll_no,
                "name": current_user.name or roll_no,
                "email": current_user.email,
                "department": current_user.department or "Computer Science & Engineering",
                "year": 3 if roll_no.startswith("23") else 2,
                "section": "A",
                "status": "active",
                "violations_count": 0,
                "late_count": 0,
                "bunk_count": 0,
                "dress_code_count": 0,
                "profile_photo": None,
                "photo_registered": False,
            },
        }

    return {"success": True, "data": student}


@router.get("/violations", response_model=Dict[str, Any])
async def get_student_violations(
    current_user: TokenPayload = Depends(require_permission("student.self")),
):
    """
    Get violation history strictly for the authenticated student.
    """
    roll_no = extract_roll_no_from_email(current_user.email or current_user.sub)
    if not roll_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine student roll number",
        )

    # Query violations collection by student_id or roll_no
    violations = await violation_repo.find_many(
        {"$or": [{"student_id": roll_no}, {"roll_no": roll_no}]},
        sort=[("timestamp", -1)],
    )

    return {
        "success": True,
        "roll_no": roll_no,
        "count": len(violations),
        "data": violations,
    }
