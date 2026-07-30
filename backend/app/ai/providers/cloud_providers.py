"""
Cloud LLM Provider Adapters (OpenAI, Gemini, Claude, Groq, OpenRouter, vLLM).
"""

import json
import re
from typing import Any, Dict, List, Optional
import httpx

from app.ai.providers.base import BaseLLMProvider
from app.core.config import settings
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class GenericOpenAICompatibleProvider(BaseLLMProvider):
    """Generic OpenAI-compatible API provider (OpenAI, Groq, OpenRouter, vLLM)."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model_name: str,
        temperature: float = 0.2,
        timeout: float = 30.0,
    ):
        super().__init__(model_name=model_name, temperature=temperature, timeout=timeout)
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return await self.chat(messages=messages, max_tokens=max_tokens)

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 1024,
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature if temperature is not None else self.temperature,
            "max_tokens": max_tokens,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error("OpenAI-compatible provider error: %s", str(e))
            raise RuntimeError(f"API Provider Error: {str(e)}")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        json_sys = (system_prompt or "") + "\nRespond exclusively in valid JSON format."
        res = await self.generate(prompt=prompt, system_prompt=json_sys)
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", res, re.DOTALL)
        if match:
            res = match.group(1)
        try:
            return json.loads(res)
        except Exception:
            return {"error": "Invalid JSON response", "raw": res}

    async def is_available(self) -> bool:
        return bool(self.api_key)


class OpenAIProvider(GenericOpenAICompatibleProvider):
    def __init__(self, api_key: str = "", model_name: str = "gpt-4o"):
        key = api_key or getattr(settings, "OPENAI_API_KEY", "")
        super().__init__(
            base_url="https://api.openai.com/v1",
            api_key=key,
            model_name=model_name,
        )


class GroqProvider(GenericOpenAICompatibleProvider):
    def __init__(self, api_key: str = "", model_name: str = "llama-3.3-70b-versatile"):
        key = api_key or getattr(settings, "GROQ_API_KEY", "")
        super().__init__(
            base_url="https://api.groq.com/openai/v1",
            api_key=key,
            model_name=model_name,
        )


class OpenRouterProvider(GenericOpenAICompatibleProvider):
    def __init__(self, api_key: str = "", model_name: str = "qwen/qwen-2.5-72b-instruct"):
        key = api_key or getattr(settings, "OPENROUTER_API_KEY", "")
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            api_key=key,
            model_name=model_name,
        )


class VLLMProvider(GenericOpenAICompatibleProvider):
    def __init__(self, base_url: str = "http://localhost:8000/v1", model_name: str = "qwen3"):
        super().__init__(
            base_url=base_url,
            api_key="EMPTY",
            model_name=model_name,
        )
