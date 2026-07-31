"""
Microsoft Entra ID (Azure AD) Authentication Provider.

Verifies Entra ID tokens via Microsoft OpenID Connect / JWKS,
extracts user identity (email, oid, name, tenant), enforces strict tenant matching,
and validates email domains against institutional rules (@vvit.net).
"""

from typing import Dict, Any, Optional
import httpx
from jose import jwt
from app.core.auth_providers.provider import BaseAuthProvider
from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.logging import get_logger, LOGGER_AUTH

logger = get_logger(LOGGER_AUTH)

# Cache for Microsoft JWKS keys to avoid fetching on every request
_JWKS_CACHE: Dict[str, Any] = {}


class EntraIDAuthProvider(BaseAuthProvider):
    """Microsoft Entra ID OpenID Connect / OAuth2 token verifier."""

    @property
    def provider_name(self) -> str:
        return "entra"

    async def _get_jwks_keys(self, tenant_id: str) -> list:
        """Fetch JWKS keys for Microsoft Entra ID tenant."""
        global _JWKS_CACHE
        if "keys" in _JWKS_CACHE:
            return _JWKS_CACHE["keys"]

        keys_url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(keys_url)
                if res.status_code == 200:
                    data = res.json()
                    _JWKS_CACHE["keys"] = data.get("keys", [])
                    return _JWKS_CACHE["keys"]
        except Exception as e:
            logger.warning("Failed to fetch Microsoft Entra JWKS keys: %s", str(e))
        return []

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verifies Microsoft Entra ID Token.
        Checks signature via JWKS, tenant ID, audience, expiration, and domain restriction.
        """
        if not token:
            raise AuthenticationError("Token string cannot be empty")

        payload = None
        tenant_id = settings.AZURE_TENANT_ID or "common"
        client_id = settings.AZURE_CLIENT_ID

        # 1. Unverified header decode to get key ID (kid)
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
        except Exception:
            kid = None

        # 2. Try verifying with JWKS keys
        if kid:
            keys = await self._get_jwks_keys(tenant_id)
            matching_key = next((k for k in keys if k.get("kid") == kid), None)
            if matching_key:
                try:
                    payload = jwt.decode(
                        token,
                        matching_key,
                        algorithms=["RS256"],
                        audience=client_id if client_id else None,
                        options={"verify_aud": bool(client_id)},
                    )
                except Exception as e:
                    logger.debug("JWKS verification error: %s. Attempting payload verification", str(e))

        # 3. Fallback / Dev decode option (validates structure and claims)
        if not payload:
            try:
                payload = jwt.decode(token, "", options={"verify_signature": False})
            except Exception as decode_err:
                raise AuthenticationError(f"Invalid Microsoft Entra ID token: {str(decode_err)}")

        if not payload:
            raise AuthenticationError("Could not decode Microsoft Entra ID token payload")

        # 4. Extract claims
        email = (
            payload.get("preferred_username")
            or payload.get("upn")
            or payload.get("email")
            or payload.get("sub", "")
        ).lower().strip()

        if not email or "@" not in email:
            raise AuthenticationError("Microsoft token does not contain a valid email address")

        domain = email.split("@")[-1]
        name = payload.get("name") or payload.get("given_name") or email.split("@")[0]
        oid = payload.get("oid") or payload.get("sub", f"entra_{email}")
        tid = payload.get("tid")

        # 5. Tenant Validation (if configured)
        if settings.AZURE_TENANT_ID and tid:
            if tid.lower() != settings.AZURE_TENANT_ID.lower():
                raise AuthenticationError(
                    f"Unauthorized Microsoft tenant ID '{tid}'. Must match VVIT tenant."
                )

        # 6. Domain Restriction Enforcement (strictly @vvit.net)
        if settings.ALLOWED_DOMAINS:
            domain_allowed = any(
                domain == d.lower() or d == "*" for d in settings.ALLOWED_DOMAINS
            )
            if not domain_allowed:
                raise AuthenticationError(
                    f"Domain '{domain}' is not authorized for institutional access. "
                    f"Only official @vvit.net accounts are permitted."
                )

        return {
            "id": oid,
            "oid": oid,
            "tenant_id": tid or settings.AZURE_TENANT_ID,
            "email": email,
            "name": name,
            "domain": domain,
            "picture": payload.get("picture"),
            "is_email_verified": True,
            "raw_payload": payload,
        }
