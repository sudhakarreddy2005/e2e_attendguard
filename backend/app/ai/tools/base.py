"""
Base Tool Abstract Interface for AttendGuard AI.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAITool(ABC):
    """Abstract base class for all modular AI tools."""

    name: str
    description: str

    @abstractmethod
    async def run(self, **kwargs) -> Dict[str, Any]:
        """Execute tool action and return structured dictionary."""
        pass
