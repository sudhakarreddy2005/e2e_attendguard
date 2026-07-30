"""
Base Authentication Provider Interface.

Defines the abstract interface for all SSO auth providers (Google, SAML, Entra ID, LDAP).
Allows plugging in new authentication sources without touching business logic.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseAuthProvider(ABC):
    """Abstract interface for Identity Providers (IdP)."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name identifier of the auth provider (e.g., 'google', 'saml', 'entra')."""
        pass

    @abstractmethod
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify the raw token/credential from the IdP.
        
        Returns normalized dictionary with keys:
            - id: Unique provider ID (e.g. google sub)
            - email: Verified email address
            - name: User's full name
            - domain: Email domain (e.g. vvit.net)
            - picture: Profile photo URL
            - is_email_verified: bool
        
        Raises Exception if token is invalid or domain is unauthorized.
        """
        pass
