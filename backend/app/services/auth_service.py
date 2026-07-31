"""
Authentication service — business logic for Microsoft Entra ID SSO, User Management, and RBAC.
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
from app.core.auth_providers.entra_provider import EntraIDAuthProvider
from app.repositories.user_repository import user_repo
from app.repositories.role_repository import role_repo
from app.repositories.common_repositories import admin_repo, audit_repo

logger = get_logger(LOGGER_AUTH)


class AuthService:

    @staticmethod
    async def microsoft_sso_login(
        id_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """
        Authenticate a user via Microsoft Entra ID (Azure AD).
        Auto-provisions accounts for all official @vvit.net Microsoft logins.
        Validates @vvit.net domain, checks account active status, and logs audit events.
        """
        provider = EntraIDAuthProvider()
        profile = await provider.verify_token(id_token)

        email = profile["email"].lower().strip()
        name = profile["name"]
        azure_oid = profile["oid"]
        azure_tenant_id = profile.get("tenant_id")
        picture = profile.get("picture")

        # 1. Search existing user in 'users' collection
        user = await user_repo.find_by_email(email)

        # 2. Auto-provision if user does not exist yet in MongoDB
        if not user:
            import re
            is_super_admin_email = (email == settings.SUPER_ADMIN_EMAIL.lower())
            is_student_roll = bool(re.match(r"^[0-9]{2}[a-zA-Z0-9]{8}@vvit\.net$", email, re.IGNORECASE))

            if is_super_admin_email:
                assigned_role = "SUPER_ADMIN"
            elif "security" in email or "gate" in email:
                assigned_role = "SECURITY"
            elif "deo" in email:
                assigned_role = "DEO"
            elif "principal" in email:
                assigned_role = "PRINCIPAL"
            elif "hod" in email:
                assigned_role = "HOD"
            elif is_student_roll:
                assigned_role = "STUDENT"
            else:
                assigned_role = "FACULTY"

            user = {
                "user_id": email,
                "email": email,
                "name": name or email.split("@")[0],
                "role": assigned_role,
                "department": "CSE" if assigned_role == "STUDENT" else "Institutional Operations",
                "designation": "Institutional Staff" if assigned_role != "STUDENT" else "Enrolled Student",
                "is_active": True,
                "active": True,
                "status": "active",
                "auth_provider": "microsoft_entra",
                "azure_oid": azure_oid,
                "azure_tenant_id": azure_tenant_id,
                "profile_photo": picture,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "login_count": 0,
            }
            db_id = await user_repo.insert_one(user)
            user = await user_repo.find_by_email(email)
            logger.info("Auto-provisioned Microsoft Entra ID user: %s (role: %s)", email, assigned_role)

        # 3. Verify active status
        is_active = user.get("is_active", True) and user.get("active", True) and user.get("status") != "disabled"
        if not is_active:
            await audit_repo.log_action(
                user=email,
                action="login_failed",
                entity_type="user",
                description=f"Disabled user '{email}' attempted Microsoft SSO login",
                ip_address=ip_address,
            )
            raise AuthenticationError("User account has been disabled by Administrator")

        # 4. Determine role and load permissions from roles collection
        is_super_admin_email = (email == settings.SUPER_ADMIN_EMAIL.lower())
        role = "SUPER_ADMIN" if is_super_admin_email else (user.get("role") or "STUDENT").upper()
        permissions = await role_repo.get_permissions_for_role(role)

        # Update last login details
        await user_repo.update_one(
            {"email": email},
            {
                "$set": {
                    "name": name or user.get("name"),
                    "auth_provider": "microsoft_entra",
                    "azure_oid": azure_oid,
                    "azure_tenant_id": azure_tenant_id,
                    "profile_photo": picture or user.get("profile_photo"),
                    "role": role,
                    "last_login": datetime.now(timezone.utc).isoformat(),
                    "last_login_ip": ip_address,
                },
                "$inc": {"login_count": 1},
            },
        )

        department = user.get("department", "Institutional Management")

        access_token = create_access_token(
            subject=email,
            role=role,
            email=email,
            name=name or user.get("name"),
            department=department,
            permissions=permissions,
        )
        refresh_token = create_refresh_token(subject=email, role=role)

        await audit_repo.log_action(
            user=email,
            action="login_success",
            entity_type="user",
            description=f"User '{email}' logged in successfully via Microsoft Entra ID (Role: {role})",
            ip_address=ip_address,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role": role,
            "permissions": permissions,
            "department": department,
            "username": email,
            "email": email,
            "name": name or user.get("name"),
            "display_name": name or user.get("name"),
            "profile_photo": picture or user.get("profile_photo"),
            "azure_oid": azure_oid,
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
            "auth_provider": "microsoft_entra",
            "department": department or "",
            "designation": designation or "",
            "is_active": True,
            "status": "active",
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
    async def delete_user(target_email: str, deleted_by: str) -> bool:
        """Delete user account and maintain database integrity across collections."""
        target_clean = target_email.lower().strip()
        prefix_username = target_clean.split("@")[0]

        # 1. Delete from users collection
        user_deleted = await user_repo.delete_one({
            "$or": [
                {"email": target_clean},
                {"user_id": target_clean},
                {"username": target_clean},
                {"email": {"$regex": f"^{target_clean}$", "$options": "i"}},
                {"username": {"$regex": f"^{prefix_username}$", "$options": "i"}},
            ]
        })

        # 2. Delete from admins collection if present
        admin_deleted = await admin_repo.delete_one({
            "$or": [
                {"email": target_clean},
                {"username": target_clean},
                {"username": prefix_username},
                {"email": {"$regex": f"^{target_clean}$", "$options": "i"}},
                {"username": {"$regex": f"^{prefix_username}$", "$options": "i"}},
            ]
        })

        # 3. Fallback scan if not matched directly
        if not user_deleted and not admin_deleted:
            all_users = await user_repo.find_many({})
            all_admins = await admin_repo.find_many({})
            matched_user = next((u for u in all_users if str(u.get("email", "")).lower() == target_clean or str(u.get("user_id", "")).lower() == target_clean), None)
            matched_admin = next((a for a in all_admins if str(a.get("email", "")).lower() == target_clean or str(a.get("username", "")).lower() == target_clean or str(a.get("username", "")).lower() == prefix_username), None)

            if matched_user:
                await user_repo.delete_one({"_id": matched_user["_id"]})
                user_deleted = True
            if matched_admin:
                await admin_repo.delete_one({"_id": matched_admin["_id"]})
                admin_deleted = True

        if not user_deleted and not admin_deleted:
            raise NotFoundError(f"User '{target_email}' not found")

        await audit_repo.log_action(
            user=deleted_by,
            action="delete_user",
            entity_type="user",
            description=f"Deleted user account '{target_clean}' from GuardDB collections",
        )
        return True

    @staticmethod
    async def list_users(limit: int = 100, skip: int = 0) -> List[dict]:
        """List all registered institutional users and IT administrators."""
        users = await user_repo.find_many({}, limit=limit, skip=skip)
        admins = await admin_repo.find_many({})

        formatted_admins = []
        user_emails = {str(u.get("email", "")).lower() for u in users if u.get("email")}

        for a in admins:
            admin_user = a.get("username", "admin")
            admin_email = a.get("email") or f"{admin_user}@vvit.net"
            if admin_email.lower() not in user_emails and admin_user.lower() not in user_emails:
                formatted_admins.append({
                    "_id": str(a.get("_id")),
                    "user_id": admin_email,
                    "username": admin_user,
                    "email": admin_email,
                    "name": a.get("display_name") or "IT Administrator",
                    "role": a.get("role", "SUPER_ADMIN"),
                    "department": a.get("department") or "IT Operations",
                    "designation": "System Administrator",
                    "auth_provider": "microsoft_entra",
                    "is_active": a.get("status") != "disabled",
                    "status": a.get("status") or "active",
                    "login_count": a.get("login_count", 0),
                })

        valid_users = [u for u in users if u.get("email") or u.get("user_id")]
        return formatted_admins + valid_users

    @staticmethod
    async def verify_user(username: str, password: str) -> Optional[dict]:
        """Verify IT Admin local credentials."""
        user = await admin_repo.find_by_username(username)
        if not user:
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

        role = user.get("role", "SUPER_ADMIN")
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
        """Seed default IAM roles and initial Super Admin user if not present."""
        admin_email = settings.SUPER_ADMIN_EMAIL.lower().strip()
        try:
            await role_repo.seed_default_roles()
            existing_admin = await user_repo.find_by_email(admin_email)
            if not existing_admin:
                user_doc = {
                    "user_id": admin_email,
                    "email": admin_email,
                    "name": "Super Admin",
                    "role": "SUPER_ADMIN",
                    "department": "Institutional Management",
                    "designation": "System Administrator",
                    "auth_provider": "microsoft_entra",
                    "is_active": True,
                    "active": True,
                    "status": "active",
                }
                await user_repo.insert_one(user_doc)
            else:
                await user_repo.update_one(
                    {"email": admin_email},
                    {"$set": {"role": "SUPER_ADMIN", "is_active": True, "status": "active"}},
                )
            logger.info("Ensured Super Admin account active: %s", admin_email)
        except Exception as e:
            logger.warning("Super Admin initialization skipped: %s", str(e))
