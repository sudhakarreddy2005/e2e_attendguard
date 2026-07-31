"""
Repository for Roles collection ('roles').
Stores role definitions, descriptions, and explicit permission lists.
"""

from typing import Optional, List
from app.database.collections import ROLES
from app.repositories.base import BaseRepository
from app.core.logging import get_logger, LOGGER_DATABASE

logger = get_logger(LOGGER_DATABASE)

DEFAULT_ROLES = [
    {
        "role_name": "SUPER_ADMIN",
        "description": "Unrestricted administrative access to all system features",
        "permissions": [
            "dashboard.view",
            "students.view",
            "students.create",
            "students.edit",
            "students.delete",
            "recognition.view",
            "recognition.scan",
            "violations.view",
            "violations.manage",
            "reports.view",
            "reports.export",
            "ai.chat",
            "users.manage",
            "settings.manage",
            "audit.view",
            "student.self",
        ],
    },
    {
        "role_name": "PRINCIPAL",
        "description": "Executive dashboard, campus metrics, and audit log inspection",
        "permissions": [
            "dashboard.view",
            "students.view",
            "recognition.view",
            "violations.view",
            "reports.view",
            "reports.export",
            "ai.chat",
            "audit.view",
        ],
    },
    {
        "role_name": "HOD",
        "description": "Departmental supervision, student analytics, and academic reports",
        "permissions": [
            "dashboard.view",
            "students.view",
            "reports.view",
            "reports.export",
            "ai.chat",
        ],
    },
    {
        "role_name": "DEO",
        "description": "Data Entry Operator for student onboarding and records management",
        "permissions": [
            "students.view",
            "students.create",
            "students.edit",
            "reports.view",
            "reports.export",
        ],
    },
    {
        "role_name": "SECURITY",
        "description": "Gate security staff for live scanner and violation logging",
        "permissions": [
            "recognition.view",
            "recognition.scan",
            "violations.view",
            "violations.manage",
        ],
    },
    {
        "role_name": "STUDENT",
        "description": "Student self-service portal for profile and violation tracking",
        "permissions": [
            "student.self",
        ],
    },
]


class RoleRepository(BaseRepository):
    """Role data access operations."""

    collection_name = ROLES

    async def find_by_name(self, role_name: str) -> Optional[dict]:
        """Find role by name (case-insensitive)."""
        name_clean = role_name.upper().strip()
        return await self.find_one({"role_name": name_clean})

    async def get_permissions_for_role(self, role_name: str) -> List[str]:
        """Get permissions array for a given role name."""
        role_doc = await self.find_by_name(role_name)
        if role_doc and "permissions" in role_doc:
            return role_doc["permissions"]
        
        # Fallback mapping if role is not in DB yet
        for default_role in DEFAULT_ROLES:
            if default_role["role_name"] == role_name.upper().strip():
                return default_role["permissions"]
        return []

    async def seed_default_roles(self) -> None:
        """Seed initial 6 roles into database if not present."""
        for role_data in DEFAULT_ROLES:
            existing = await self.find_by_name(role_data["role_name"])
            if not existing:
                await self.insert_one(role_data)
                logger.info("Seeded default role: %s", role_data["role_name"])


role_repo = RoleRepository()
