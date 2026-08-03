"""
Discipline Configuration Service — Dynamic administration of institutional settings.

Allows administrators to configure thresholds, active semester, academic year,
notification mode, and committee email without changing source code.
"""

from typing import Any, Dict
from app.repositories.common_repositories import settings_repo
from app.core.config import settings

CONFIG_KEY = "discipline_config"

DEFAULT_DISCIPLINE_CONFIG: Dict[str, Any] = {
    "current_academic_year": "2025-2026",
    "current_semester": "4-1",
    "notifications_enabled": True,
    "notification_mode": "live",
    "threshold_level_1": 5,
    "threshold_level_2": 10,
    "threshold_level_3": 15,
    "disciplinary_committee_email": "discipline@vvit.net",
    "department_name": "Department of Computer Science & Engineering",
}


class DisciplineConfigService:
    """Service to load and update dynamic disciplinary policy configurations."""

    @staticmethod
    async def get_config() -> Dict[str, Any]:
        """Fetch current discipline settings merged with defaults."""
        doc = await settings_repo.get_setting(CONFIG_KEY)
        if not doc or not isinstance(doc.get("value"), dict):
            return DEFAULT_DISCIPLINE_CONFIG.copy()

        merged = DEFAULT_DISCIPLINE_CONFIG.copy()
        merged.update(doc["value"])
        return merged

    @staticmethod
    async def update_config(new_values: Dict[str, Any]) -> Dict[str, Any]:
        """Update disciplinary settings in MongoDB."""
        current = await DisciplineConfigService.get_config()
        current.update(new_values)

        # Validate values
        if "threshold_level_1" in current:
            current["threshold_level_1"] = int(current["threshold_level_1"])
        if "threshold_level_2" in current:
            current["threshold_level_2"] = int(current["threshold_level_2"])
        if "threshold_level_3" in current:
            current["threshold_level_3"] = int(current["threshold_level_3"])

        if current["notification_mode"] not in ("dry_run", "shadow", "live"):
            current["notification_mode"] = "live"

        await settings_repo.set_setting(
            key=CONFIG_KEY,
            value=current,
            description="Institutional Disciplinary Escalation Policy Configuration",
            category="discipline",
        )
        return current


discipline_config_service = DisciplineConfigService()
