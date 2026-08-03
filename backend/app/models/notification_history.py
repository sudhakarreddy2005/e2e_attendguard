"""
Notification History Document Model.

Stores full institutional audit trails for semester-based disciplinary escalation emails.
"""

import time
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NotificationHistoryDocument(BaseModel):
    """Document schema for the dedicated notification_history collection."""
    student_id: str
    roll_number: str
    academic_year: str
    semester: str
    notification_level: int  # 1, 2, or 3
    threshold: int  # 5, 10, or 15
    recipients: List[str] = Field(default_factory=list)
    notification_mode: str = "live"  # dry_run, shadow, live
    delivery_status: str = "SENT"  # SENT, FAILED, DRY_RUN_COMPLETED, SHADOW_DISPATCHED
    provider: str = "MS_GRAPH"  # MS_GRAPH, SMTP, MOCK
    provider_response: Dict[str, Any] = Field(default_factory=dict)
    sent_at: float = Field(default_factory=time.time)
    correlation_id: str = Field(default_factory=lambda: f"corr_{uuid.uuid4().hex[:8]}")
    retry_count: int = 0
    subject: Optional[str] = None
    email_body_snippet: Optional[str] = None
