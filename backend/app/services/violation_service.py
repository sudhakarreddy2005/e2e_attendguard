"""
Violation service — business logic for violation management.
"""

from typing import Optional

from app.core.exceptions import ValidationError, ViolationNotFoundError
from app.core.logging import get_logger, LOGGER_APP
from app.repositories.violation_repository import violation_repo
from app.repositories.student_repository import student_repo
from app.repositories.common_repositories import audit_repo
from app.schemas.violation import ALLOWED_VIOLATION_TYPES, ALLOWED_LOCATIONS, ALLOWED_STATUSES

logger = get_logger(LOGGER_APP)


class ViolationService:

    @staticmethod
    async def create_violation(violation_data: dict, created_by: str = "system") -> str:
        """Create a violation and update student counters."""
        v_type = violation_data.get("type", "")
        location = violation_data.get("location", "")
        roll_no = violation_data.get("roll_no", "")

        if not v_type or v_type not in ALLOWED_VIOLATION_TYPES:
            raise ValidationError(
                f"Invalid violation type: {v_type}. Allowed: {list(ALLOWED_VIOLATION_TYPES)}"
            )
        if not location or location not in ALLOWED_LOCATIONS:
            raise ValidationError(
                f"Invalid location: {location}. Allowed: {list(ALLOWED_LOCATIONS)}"
            )
        if not roll_no:
            raise ValidationError("Student roll number is required")

        for field in ["department", "section", "remarks"]:
            if not violation_data.get(field, "").strip():
                raise ValidationError(f"Missing required field: {field}")

        # Normalize status
        status = violation_data.get("status", "Pending")
        violation_data["status"] = status if status in ALLOWED_STATUSES else "Pending"

        # Remove any stale 'student_id' key from frontend payloads
        violation_data.pop("student_id", None)

        # Attach active academic_year and semester tags if missing
        from app.services.discipline_config_service import discipline_config_service
        config = await discipline_config_service.get_config()

        if "academic_year" not in violation_data:
            violation_data["academic_year"] = config.get("current_academic_year", "2025-2026")
        if "semester" not in violation_data:
            violation_data["semester"] = config.get("current_semester", "3-1")

        violation_id = await violation_repo.insert_one(violation_data)

        # Atomically increment student violation counters for total & specific semester
        await student_repo.increment_violation(roll_no, v_type, semester=violation_data["semester"])

        # Trigger semester disciplinary escalation pipeline via NotificationService
        try:
            from app.services.notification_service import notification_service
            notif_res = await notification_service.process_disciplinary_escalation(
                roll_no=roll_no,
                violation_type=v_type,
                location=location,
                created_by=created_by,
                academic_year_override=violation_data["academic_year"],
                semester_override=violation_data["semester"],
            )
            logger.info("[Violation Pipeline] Disciplinary escalation trigger for %s: %s", roll_no, notif_res.get("reason") or f"Level {notif_res.get('level')}")
        except Exception as e:
            logger.error("[Violation Pipeline Error] Escalation trigger failed for %s: %s", roll_no, e)




        await audit_repo.log_action(
            user=created_by,
            action="create",
            entity_type="violation",
            entity_id=violation_id,
            description=f"{v_type} violation for {roll_no} at {location}",
        )

        logger.info("Created violation: %s for %s at %s", v_type, roll_no, location)
        return violation_id


    @staticmethod
    async def delete_violation(violation_id: str, deleted_by: str = "system") -> bool:
        """Delete a violation and decrement student counters."""
        violation = await violation_repo.find_by_id(violation_id)
        if not violation:
            raise ViolationNotFoundError()

        roll_no = violation["roll_no"]
        v_type = violation["type"]
        v_sem = violation.get("semester")

        await violation_repo.delete_one({"_id": __import__("bson").ObjectId(violation_id)})
        await student_repo.decrement_violation(roll_no, v_type, semester=v_sem)

        # Check updated semester count and reset any invalidated notification history levels
        try:
            from app.services.discipline_config_service import discipline_config_service
            config = await discipline_config_service.get_config()
            acad_year = violation.get("academic_year") or config.get("current_academic_year", "2025-2026")
            sem = v_sem or config.get("current_semester", "3-1")

            sem_violations = await violation_repo.find_by_student_and_semester(
                roll_no=roll_no,
                academic_year=acad_year,
                semester=sem,
            )
            updated_count = len(sem_violations)

            l1 = int(config.get("threshold_level_1", 5))
            l2 = int(config.get("threshold_level_2", 10))
            l3 = int(config.get("threshold_level_3", 15))

            from app.repositories.notification_history_repository import notification_history_repo
            cleared = await notification_history_repo.reset_invalidated_levels(
                roll_number=roll_no,
                academic_year=acad_year,
                semester=sem,
                current_count=updated_count,
                threshold_level_1=l1,
                threshold_level_2=l2,
                threshold_level_3=l3,
            )
            if cleared > 0:
                logger.info("[Violation Service] Reset %d notification history entry/entries for %s semester %s (count dropped to %d)", cleared, roll_no, sem, updated_count)
        except Exception as e:
            logger.error("[Violation Service Error] Failed to reset notification history on deletion: %s", e)

        await audit_repo.log_action(
            user=deleted_by,
            action="delete",
            entity_type="violation",
            entity_id=violation_id,
            description=f"Deleted {v_type} violation for {roll_no}",
        )

        return True

    @staticmethod
    async def get_violations(filters: Optional[dict] = None) -> list[dict]:
        """Get violations with student names."""
        import datetime as _dt
        IST = _dt.timezone(_dt.timedelta(hours=5, minutes=30))

        violations = await violation_repo.find_with_student_names(filters)

        for v in violations:
            v["_id"] = str(v.get("_id", ""))
            dt = v.get("created_at")
            if hasattr(dt, "strftime"):
                # Convert UTC datetime to IST for display
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=_dt.timezone.utc)
                dt_ist = dt.astimezone(IST)
                v["date"] = dt_ist.strftime("%b %d, %Y %I:%M %p")
                v["iso_date"] = dt_ist.strftime("%Y-%m-%d")
                v["created_at"] = dt_ist.isoformat()

        return violations

    @staticmethod
    async def update_violation_status(
        violation_id: str,
        status: str,
        reviewed_by: Optional[str] = None,
    ) -> bool:
        """Update violation status."""
        if status not in ALLOWED_STATUSES:
            raise ValidationError(f"Invalid status: {status}")

        update_data: dict = {"status": status}
        if reviewed_by:
            update_data["reviewed_by"] = reviewed_by

        try:
            from bson import ObjectId
            oid = ObjectId(violation_id)
            query = {"$or": [{"_id": oid}, {"_id": violation_id}]}
        except Exception:
            query = {"_id": violation_id}

        return await violation_repo.update_one(
            query,
            {"$set": update_data},
        )
