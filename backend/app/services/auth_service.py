"""
Authentication service — business logic for Google OAuth SSO, User Management, and RBAC.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from app.core.config import settings
from app.core.exceptions import AuthenticationError, DuplicateError, ValidationError, NotFoundError
from app.core.logging import get_logger, LOGGER_AUTH
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    VALID_ROLES,
)
from app.core.auth_providers.google_provider import GoogleAuthProvider
from app.repositories.user_repository import user_repo
from app.repositories.common_repositories import admin_repo, audit_repo

logger = get_logger(LOGGER_AUTH)


class AuthService:

    @staticmethod
    async def google_sso_login(id_token: str, ip_address: Optional[str] = None) -> dict:
        """
        Authenticate a user via Google OAuth 2.0.
        Auto-provisions SUPER_ADMIN for '23BQ1A05A9@vvit.net' on first login.
        """
        provider = GoogleAuthProvider()
        profile = await provider.verify_token(id_token)

        email = profile["email"]
        name = profile["name"]
        google_id = profile["id"]
        picture = profile.get("picture")

        # 1. Search existing user in 'users' collection
        user = await user_repo.find_by_email(email)

        # Super Admin Auto-Provisioning Check
        is_super_admin_email = (email.lower() == settings.SUPER_ADMIN_EMAIL.lower())

        if not user:
            # Auto-provision new user with specific institutional role parsing
            if is_super_admin_email:
                assigned_role = "super_admin"
            elif "security" in email.lower() or "gate" in email.lower():
                assigned_role = "security"
            elif "deo" in email.lower():
                assigned_role = "deo"
            elif "principal" in email.lower():
                assigned_role = "principal"
            elif "hod" in email.lower():
                assigned_role = "hod"
            elif email.startswith("23") or email.startswith("24"):
                assigned_role = "student"
            else:
                assigned_role = "faculty"
            user_doc = {
                "user_id": email,
                "email": email,
                "name": name,
                "role": assigned_role,
                "auth_provider": "google",
                "google_id": google_id,
                "profile_photo": picture,
                "is_active": True,
                "status": "active",
                "last_login": datetime.now(timezone.utc).isoformat(),
                "last_login_ip": ip_address,
                "login_count": 1,
            }
            db_id = await user_repo.insert_one(user_doc)
            user = await user_repo.find_by_id(db_id)
            logger.info("Auto-provisioned Google SSO user: %s (role: %s)", email, assigned_role)
        else:
            # Update user info if needed
            if not user.get("is_active"):
                raise AuthenticationError("User account has been disabled by Administrator")

            # Force/update role based on email pattern or existing user role
            if is_super_admin_email:
                new_role = "super_admin"
            elif "security" in email.lower() or "gate" in email.lower():
                new_role = "security"
            elif "deo" in email.lower():
                new_role = "deo"
            elif "principal" in email.lower():
                new_role = "principal"
            elif "hod" in email.lower():
                new_role = "hod"
            else:
                new_role = user.get("role", "faculty")

            await user_repo.update_one(
                {"email": email},
                {
                    "$set": {
                        "name": name or user.get("name"),
                        "google_id": google_id,
                        "profile_photo": picture or user.get("profile_photo"),
                        "role": new_role,
                        "last_login": datetime.now(timezone.utc).isoformat(),
                        "last_login_ip": ip_address,
                    },
                    "$inc": {"login_count": 1},
                },
            )
            user["role"] = new_role

        role = user.get("role", "faculty")
        access_token = create_access_token(subject=email, role=role)
        refresh_token = create_refresh_token(subject=email, role=role)

        # Audit log
        await audit_repo.log_action(
            user=email,
            action="login_sso",
            entity_type="user",
            description=f"User '{email}' logged in via Google SSO (role: {role})",
            ip_address=ip_address,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role": role,
            "username": email,
            "email": email,
            "name": name,
            "display_name": name,
            "profile_photo": picture,
        }

    @staticmethod
    async def invite_user(
        email: str,
        role: str,
        name: str = "",
        department: Optional[str] = None,
        designation: Optional[str] = None,
        invited_by: str = "super_admin",
    ) -> str:
        """Invite/onboard a user by institutional email."""
        email = email.lower().strip()
        if role not in VALID_ROLES:
            raise ValidationError(f"Invalid role: {role}. Valid roles: {VALID_ROLES}")

        existing = await user_repo.find_by_email(email)
        if existing:
            raise DuplicateError(f"User with email '{email}' already exists")

        user_doc = {
            "user_id": email,
            "email": email,
            "name": name or email.split("@")[0],
            "role": role,
            "auth_provider": "google",
            "department": department or "",
            "designation": designation or "",
            "is_active": True,
            "status": "pending_invite",
            "login_count": 0,
        }

        user_id = await user_repo.insert_one(user_doc)

        await audit_repo.log_action(
            user=invited_by,
            action="invite_user",
            entity_type="user",
            entity_id=user_id,
            description=f"Invited user '{email}' with role '{role}'",
        )
        return user_id

    @staticmethod
    async def update_user_role(target_email: str, new_role: str, updated_by: str) -> bool:
        """Update role of a user."""
        target_email = target_email.lower().strip()
        if new_role not in VALID_ROLES:
            raise ValidationError(f"Invalid role: {new_role}")

        user = await user_repo.find_by_email(target_email)
        if not user:
            raise NotFoundError(f"User '{target_email}' not found")

        old_role = user.get("role")
        await user_repo.update_one({"email": target_email}, {"$set": {"role": new_role}})

        await audit_repo.log_action(
            user=updated_by,
            action="update_role",
            entity_type="user",
            description=f"Updated user '{target_email}' role from '{old_role}' to '{new_role}'",
        )
        return True

    @staticmethod
    async def toggle_user_status(target_email: str, is_active: bool, updated_by: str) -> bool:
        """Enable or disable user account."""
        target_email = target_email.lower().strip()
        user = await user_repo.find_by_email(target_email)
        if not user:
            raise NotFoundError(f"User '{target_email}' not found")

        status_str = "active" if is_active else "suspended"
        await user_repo.update_one({"email": target_email}, {"$set": {"is_active": is_active, "status": status_str}})

        await audit_repo.log_action(
            user=updated_by,
            action="toggle_status",
            entity_type="user",
            description=f"Set user '{target_email}' active state to {is_active}",
        )
        return True

    @staticmethod
    async def list_users(limit: int = 100, skip: int = 0) -> List[dict]:
        """List all registered institutional users."""
        users = await user_repo.find_many({}, limit=limit, skip=skip)
        return users

    @staticmethod
    async def verify_user(username: str, password: str) -> Optional[dict]:
        """Verify IT Admin local credentials."""
        user = await admin_repo.find_by_username(username)
        if not user:
            # Fallback check in users collection
            user = await user_repo.find_by_email(username)
            if not user or not user.get("password_hash"):
                return None
            if not verify_password(password, user["password_hash"]):
                return None
            return user

        if not verify_password(password, user["password_hash"]):
            return None
        return user

    @staticmethod
    async def login(username: str, password: str) -> dict:
        """Legacy local IT Admin login fallback."""
        user = await AuthService.verify_user(username, password)
        if not user:
            raise AuthenticationError("Invalid username or password")

        role = user.get("role", "admin")
        email = user.get("email") or user.get("username", username)

        access_token = create_access_token(subject=email, role=role)
        refresh_token = create_refresh_token(subject=email, role=role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role": role,
            "username": email,
            "display_name": user.get("display_name") or user.get("name") or username,
        }

    @staticmethod
    async def refresh_access_token(refresh_token_str: str) -> dict:
        """Generate new access token from refresh token."""
        payload = decode_token(refresh_token_str)
        if not payload or payload.token_type != "refresh":
            raise AuthenticationError("Invalid or expired refresh token")

        new_access = create_access_token(subject=payload.sub, role=payload.role)
        return {"access_token": new_access, "role": payload.role}

    @staticmethod
    async def ensure_default_admin() -> None:
        """Create or update initial Super Admin user if not present."""
        admin_email = settings.SUPER_ADMIN_EMAIL.lower().strip()
        try:
            user_doc = {
                "user_id": admin_email,
                "email": admin_email,
                "name": "Super Admin",
                "role": "super_admin",
                "auth_provider": "google",
                "is_active": True,
                "status": "active",
            }
            await user_repo.update_one(
                {"email": admin_email},
                {"$setOnInsert": user_doc},
            )
            # Ensure role is super_admin
            await user_repo.update_one(
                {"email": admin_email},
                {"$set": {"role": "super_admin", "is_active": True}},
            )
            logger.info("Ensured Super Admin account active: %s", admin_email)
        except Exception as e:
            logger.warning("Super Admin initialization skipped: %s", str(e))
