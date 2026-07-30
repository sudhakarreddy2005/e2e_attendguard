"""
Base LLM Provider Abstract Interface.

Ensures that replacing the underlying LLM (Ollama, Qwen, vLLM, OpenAI, Gemini, Groq, Claude, etc.)
requires ZERO changes to agent or business logic.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers in AttendGuard."""

    def __init__(self, model_name: str, temperature: float = 0.2, timeout: float = 30.0):
        self.model_name = model_name
        self.temperature = temperature
        self.timeout = timeout

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> str:
        """Generate text from a prompt."""
        pass

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 1024,
    ) -> str:
        """Process multi-turn conversation messages."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON output."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider is online and healthy."""
        pass
