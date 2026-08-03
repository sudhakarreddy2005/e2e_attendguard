"""
Production Institutional Notification & Disciplinary Escalation Engine.

Provides complete semester-scoped escalation pipeline orchestration:
  - Scope: Semester-specific violation tracking (1-1 to 4-2)
  - Level 1: 5 Violations → Student Advisory
  - Level 2: 10 Violations → Student + Assigned Counsellor Warning
  - Level 3: 15 Violations → Student + Counsellor + Disciplinary Committee Notification
  - Idempotency: Triggered ONCE per level per semester
  - Formats: Official institutional email without "Dear Parent" headers
  - Delivery: Microsoft Graph API app-only OAuth2 with retries
  - Audit: Dedicated `notification_history` MongoDB collection
"""

import datetime
import html
import time
import uuid
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.logging import get_logger, LOGGER_AUDIT
from app.repositories.common_repositories import audit_repo, notification_repo
from app.repositories.student_repository import student_repo
from app.repositories.violation_repository import violation_repo
from app.repositories.notification_history_repository import notification_history_repo
from app.services.discipline_config_service import discipline_config_service
from app.services.notification_providers import msgraph_provider

logger = get_logger(LOGGER_AUDIT)


class NotificationService:
    """Enterprise Disciplinary Notification Service managing institutional alerts."""

    @staticmethod
    def _format_date(dt_val: Any) -> str:
        """Format datetime or timestamp into readable institutional format."""
        if not dt_val:
            return datetime.datetime.now(datetime.timezone.utc).strftime("%b %d, %Y %I:%M %p UTC")
        if isinstance(dt_val, (int, float)):
            return datetime.datetime.fromtimestamp(dt_val, datetime.timezone.utc).strftime("%b %d, %Y %I:%M %p UTC")
        if hasattr(dt_val, "strftime"):
            return dt_val.strftime("%b %d, %Y %I:%M %p UTC")
        return str(dt_val)

    @staticmethod
    async def process_disciplinary_escalation(
        roll_no: str,
        violation_type: str = "Campus Bunk / Unexcused Absence",
        location: str = "Campus Grounds",
        created_by: str = "system",
        academic_year_override: Optional[str] = None,
        semester_override: Optional[str] = None,
        mode_override: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrate institutional disciplinary escalation pipeline.
        Invoked automatically by ViolationService on violation creation.
        """
        corr_id = correlation_id or f"corr_{uuid.uuid4().hex[:8]}"
        clean_roll = roll_no.strip().upper()

        logger.info("[Escalation Pipeline] Processing escalation for student roll_no=%s [corr_id=%s]", clean_roll, corr_id)

        # 1. Fetch Dynamic Admin Configuration
        config = await discipline_config_service.get_config()
        academic_year = academic_year_override or config.get("current_academic_year", "2025-2026")
        semester = semester_override or config.get("current_semester", "3-1")
        notifications_enabled = config.get("notifications_enabled", True)
        mode = mode_override or config.get("notification_mode") or getattr(settings, "NOTIFICATION_MODE", "live")

        level_1_thresh = int(config.get("threshold_level_1", 5))
        level_2_thresh = int(config.get("threshold_level_2", 10))
        level_3_thresh = int(config.get("threshold_level_3", 15))
        committee_email = config.get("disciplinary_committee_email", "discipline@vvit.net")
        dept_name = config.get("department_name", "Department of Computer Science & Engineering")

        # 2. Check Feature Flag
        if not notifications_enabled:
            msg = "Disciplinary notifications disabled by institutional configuration."
            logger.warning("[Escalation Pipeline] Suppressed: %s [corr_id=%s]", msg, corr_id)
            return {"triggered": False, "reason": "DISABLED_BY_CONFIG", "message": msg}

        # 3. Fetch Student Document
        student = await student_repo.find_by_roll_no(clean_roll)
        if not student:
            msg = f"Student record for roll_no '{clean_roll}' not found in GuardDB."
            logger.warning("[Escalation Pipeline] Missing student: %s [corr_id=%s]", msg, corr_id)
            return {"triggered": False, "reason": "STUDENT_NOT_FOUND", "message": msg}

        # 4. Fetch Semester-Scoped Violations from MongoDB
        semester_violations = await violation_repo.find_by_student_and_semester(
            roll_no=clean_roll,
            academic_year=academic_year,
            semester=semester,
        )

        current_semester_count = len(semester_violations)
        # Fallback to denormalized total count if semester tag was not present on legacy records
        if current_semester_count == 0 and int(student.get("violations_count", 0)) > 0:
            current_semester_count = int(student.get("violations_count", 0))

        logger.info(
            "[Escalation Pipeline] Student %s semester %s violation count: %d [corr_id=%s]",
            clean_roll, semester, current_semester_count, corr_id
        )

        # 5. Evaluate Escalation Threshold & Level
        level = 0
        threshold = 0

        if current_semester_count >= level_3_thresh:
            level = 3
            threshold = level_3_thresh
        elif current_semester_count >= level_2_thresh:
            level = 2
            threshold = level_2_thresh
        elif current_semester_count >= level_1_thresh:
            level = 1
            threshold = level_1_thresh

        if level == 0:
            msg = f"Semester violation count ({current_semester_count}) below minimum threshold ({level_1_thresh})."
            logger.info("[Escalation Pipeline] %s [corr_id=%s]", msg, corr_id)
            return {"triggered": False, "reason": "THRESHOLD_NOT_MET", "count": current_semester_count}

        # 6. Idempotency Check (Only trigger ONCE per level per student per semester)
        already_sent = await notification_history_repo.has_been_notified(
            roll_number=clean_roll,
            academic_year=academic_year,
            semester=semester,
            notification_level=level,
        )

        if already_sent:
            msg = f"Level {level} notification already sent to {clean_roll} for {academic_year} Semester {semester}. Idempotency check suppressed duplicate email."
            logger.info("[Escalation Pipeline] Idempotency: %s [corr_id=%s]", msg, corr_id)
            return {"triggered": False, "reason": "IDEMPOTENCY_SUPPRESSED", "level": level, "message": msg}

        # 7. Resolve Recipient Addresses
        student_email = student.get("contact_info", {}).get("email") or student.get("email") or f"{clean_roll.lower()}@vvit.net"
        student_email = student_email.strip().lower()

        counsellor_email = student.get("counsellor_email") or student.get("counselor_email") or f"counselor.{student.get('department','cse').lower()}@vvit.net"
        counsellor_email = counsellor_email.strip().lower()

        recipients: List[str] = [student_email]

        if level == 2:
            if counsellor_email not in recipients:
                recipients.append(counsellor_email)
        elif level == 3:
            if counsellor_email not in recipients:
                recipients.append(counsellor_email)
            if committee_email not in recipients:
                recipients.append(committee_email.strip().lower())

        # 8. Define Subject & Administrative Messages based on Escalation Level
        if level == 1:
            subject = "AttendGuard – Academic Discipline Advisory"
            stage_title = "Level 1 Academic Discipline Advisory"
            admin_msg = (
                f"You have accumulated <strong>{current_semester_count} violations</strong> during the current "
                f"academic semester (Semester {html.escape(semester)}, {html.escape(academic_year)}). "
                "This serves as an official institutional early warning. Please adhere strictly to campus attendance and disciplinary guidelines to avoid further formal escalation."
            )
        elif level == 2:
            subject = "AttendGuard – Academic Discipline Warning"
            stage_title = "Level 2 Formal Academic Discipline Warning"
            admin_msg = (
                f"Student <strong>{html.escape(student.get('name', 'Student'))}</strong> ({html.escape(clean_roll)}) "
                f"has accumulated <strong>{current_semester_count} violations</strong> during Semester {html.escape(semester)}. "
                "This exceeds the formal warning threshold. The student is hereby advised to schedule a mandatory counselling session with their assigned faculty counsellor."
            )
        else:
            subject = "AttendGuard – Disciplinary Committee Notification"
            stage_title = "Level 3 Disciplinary Committee Escalation"
            admin_msg = (
                f"<strong>CRITICAL INSTITUTIONAL ESCALATION:</strong> Student <strong>{html.escape(student.get('name', 'Student'))}</strong> "
                f"({html.escape(clean_roll)}) has crossed the institutional threshold of <strong>{level_3_thresh} violations</strong> "
                f"(Current Count: <strong>{current_semester_count}</strong>) for Semester {html.escape(semester)}. "
                "This case is formally referred to the Institutional Disciplinary Committee for official review and further action."
            )

        # 9. Compute Semester Violation Breakdown & Dates
        v_breakdown: Dict[str, int] = {}
        first_date_str = "N/A"
        latest_date_str = "N/A"

        if semester_violations:
            for v in semester_violations:
                v_type = v.get("type", "General Violation")
                v_breakdown[v_type] = v_breakdown.get(v_type, 0) + 1

            first_v = semester_violations[-1].get("created_at")
            latest_v = semester_violations[0].get("created_at")
            first_date_str = NotificationService._format_date(first_v)
            latest_date_str = NotificationService._format_date(latest_v)
        else:
            v_breakdown["Unexcused Absence / Bunk"] = current_semester_count

        breakdown_html = "".join(
            f"<li><strong>{html.escape(k)}:</strong> {v} incident(s)</li>"
            for k, v in v_breakdown.items()
        )

        # 10. Construct Professional Institutional Email Body (HTML)
        student_name = html.escape(str(student.get("name", "Student")))
        department = html.escape(str(student.get("department", "CSE")))
        section = html.escape(str(student.get("section", "A")))

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .card {{ max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .header {{ background: #1e293b; color: #ffffff; padding: 24px; text-align: center; border-bottom: 3px solid #3b82f6; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }}
    .header p {{ margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }}
    .content {{ padding: 28px; }}
    .section-title {{ font-size: 14px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }}
    .grid {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
    .grid td {{ padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f8fafc; }}
    .grid td.label {{ font-weight: 600; color: #64748b; width: 40%; }}
    .grid td.value {{ color: #0f172a; font-weight: 600; }}
    .notice-box {{ background: {"#fef2f2" if level==3 else ("#fffbeb" if level==2 else "#eff6ff")}; border-left: 4px solid {"#ef4444" if level==3 else ("#f59e0b" if level==2 else "#3b82f6")}; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; }}
    .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
    .footer strong {{ color: #334155; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Academic Discipline Notification</h1>
      <p>AttendGuard Campus Intelligence & Discipline Portal</p>
    </div>
    <div class="content">
      <div class="section-title">Student Information</div>
      <table class="grid">
        <tr><td class="label">Student Name</td><td class="value">{student_name}</td></tr>
        <tr><td class="label">Roll Number</td><td class="value"><code>{clean_roll}</code></td></tr>
        <tr><td class="label">Department & Section</td><td class="value">{department} - Section {section}</td></tr>
        <tr><td class="label">Academic Year</td><td class="value">{academic_year}</td></tr>
        <tr><td class="label">Current Semester</td><td class="value">Semester {semester}</td></tr>
      </table>

      <div class="section-title">Current Semester Statistics</div>
      <table class="grid">
        <tr><td class="label">Semester Violation Total</td><td class="value" style="color: {"#dc2626" if level>=2 else "#d97706"}; font-size: 15px;">{current_semester_count} Incident(s)</td></tr>
        <tr><td class="label">Escalation Stage</td><td class="value">{stage_title}</td></tr>
        <tr><td class="label">First Recorded Violation</td><td class="value">{first_date_str}</td></tr>
        <tr><td class="label">Latest Recorded Violation</td><td class="value">{latest_date_str}</td></tr>
      </table>

      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 600; color: #475569;">Violation Categories Breakdown:</span>
        <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; color: #334155;">
          {breakdown_html}
        </ul>
      </div>

      <div class="section-title">Administrative Notice</div>
      <div class="notice-box">
        {admin_msg}
      </div>
    </div>
    <div class="footer">
      <p style="margin:0 0 4px 0;"><strong>{dept_name}</strong></p>
      <p style="margin:0 0 4px 0;">AttendGuard Campus Intelligence Platform</p>
      <p style="margin:0; font-size:11px; color:#94a3b8;">This is an automatically generated institutional notification.</p>
    </div>
  </div>
</body>
</html>
"""

        # 11. Dispatch Notification based on Mode
        target_recipients = recipients if mode == "live" else ([getattr(settings, "SHADOW_TEST_EMAIL", "admin@vvit.net")] if mode == "shadow" else recipients)

        dispatch_result: Dict[str, Any] = {}
        status = "SENT"
        provider_name = "MS_GRAPH"

        if mode == "dry_run":
            logger.info("[Escalation Pipeline] [DRY_RUN] Mode is dry_run. Email payload generated for %s without network dispatch.", target_recipients)
            status = "DRY_RUN_COMPLETED"
            dispatch_result = {"mode": "dry_run", "recipients": target_recipients, "skipped_network": True}

        elif mode == "shadow":
            shadow_target = getattr(settings, "SHADOW_TEST_EMAIL", "admin@vvit.net")
            logger.info("[Escalation Pipeline] [SHADOW] Shadow dispatch targeting '%s' for student %s.", shadow_target, clean_roll)
            res = await msgraph_provider.send_email(
                subject=f"[SHADOW] {subject}",
                html_body=html_body,
                recipients=[shadow_target],
                correlation_id=corr_id,
            )
            status = "SHADOW_DISPATCHED" if res.get("success") else "SEND_FAILED"
            dispatch_result = res

        elif mode == "live":
            logger.info("[Escalation Pipeline] [LIVE] Dispatching institutional email to %s for student %s.", target_recipients, clean_roll)
            res = await msgraph_provider.send_email(
                subject=subject,
                html_body=html_body,
                recipients=target_recipients,
                correlation_id=corr_id,
            )
            status = "LIVE_SENT" if res.get("success") else "SEND_FAILED"
            dispatch_result = res

        # 12. Save Dedicated Audit Record in `notification_history` Collection
        history_doc = {
            "student_id": str(student.get("_id") or clean_roll),
            "roll_number": clean_roll,
            "academic_year": academic_year,
            "semester": semester,
            "notification_level": level,
            "threshold": threshold,
            "recipients": recipients,
            "notification_mode": mode,
            "delivery_status": status,
            "provider": provider_name,
            "provider_response": dispatch_result,
            "sent_at": time.time(),
            "correlation_id": corr_id,
            "retry_count": dispatch_result.get("retry_count", 0),
            "subject": subject,
            "email_body_snippet": f"Semester {semester} - {current_semester_count} violations",
        }

        history_id = await notification_history_repo.log_notification(history_doc)
        logger.info("[Escalation Pipeline] Recorded audit entry in 'notification_history' id=%s [corr_id=%s]", history_id, corr_id)

        # 13. Audit Log & Return
        await audit_repo.log_action(
            user=created_by,
            action="disciplinary_escalation",
            entity_type="student",
            entity_id=clean_roll,
            description=f"Triggered Level {level} disciplinary escalation ({current_semester_count} violations in Semester {semester})",
            changes={"mode": mode, "status": status, "level": level, "recipients": recipients, "correlation_id": corr_id},
        )

        return {
            "triggered": True,
            "level": level,
            "threshold": threshold,
            "current_count": current_semester_count,
            "recipients": recipients,
            "mode": mode,
            "status": status,
            "history_id": history_id,
            "correlation_id": corr_id,
        }


# Singleton instance
notification_service = NotificationService()
