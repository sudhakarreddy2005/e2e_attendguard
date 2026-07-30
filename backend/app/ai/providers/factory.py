"""
LLM Provider Factory.
"""

from typing import Optional
from app.ai.providers.base import BaseLLMProvider
from app.ai.providers.ollama import OllamaProvider
from app.ai.providers.cloud_providers import (
    OpenAIProvider,
    GroqProvider,
    OpenRouterProvider,
    VLLMProvider,
)
from app.core.config import settings
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class LLMProviderFactory:
    """Factory to retrieve active LLM Provider instance."""

    _instance: Optional[BaseLLMProvider] = None

    @classmethod
    def get_provider(cls, provider_type: Optional[str] = None) -> BaseLLMProvider:
        p_type = (provider_type or getattr(settings, "AI_PROVIDER", "ollama")).lower()

        if p_type == "ollama":
            return OllamaProvider()
        elif p_type == "openai":
            return OpenAIProvider()
        elif p_type == "groq":
            return GroqProvider()
        elif p_type == "openrouter":
            return OpenRouterProvider()
        elif p_type == "vllm":
            return VLLMProvider()
        else:
            logger.info("Unknown provider '%s', defaulting to OllamaProvider", p_type)
            return OllamaProvider()
