"""
Ollama Provider implementation (Qwen 3 8B Instruct / DeepSeek / Llama).
"""

import json
import re
from typing import Any, Dict, List, Optional
import httpx

from app.ai.providers.base import BaseLLMProvider
from app.core.config import settings
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class OllamaProvider(BaseLLMProvider):
    """Local Ollama / Qwen 3 provider."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.1,
        timeout: float = 30.0,
    ):
        base_url = base_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = model_name or getattr(settings, "OLLAMA_MODEL", "qwen2.5:latest")
        super().__init__(model_name=model_name, temperature=temperature, timeout=timeout)
        self.base_url = base_url.rstrip("/")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> str:
        """Generate response via Ollama /api/generate."""
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "").strip()
        except Exception as e:
            logger.warning("Ollama generate failed: %s", str(e))
            raise RuntimeError(f"Ollama provider error: {str(e)}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 1024,
    ) -> str:
        """Process multi-turn chat via Ollama /api/chat."""
        temp = temperature if temperature is not None else self.temperature
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temp,
                "num_predict": max_tokens,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                msg = data.get("message", {})
                return msg.get("content", "").strip()
        except Exception as e:
            logger.warning("Ollama chat failed: %s", str(e))
            raise RuntimeError(f"Ollama chat error: {str(e)}")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate valid JSON response."""
        json_sys = (system_prompt or "") + "\nYou MUST respond strictly in valid JSON format."
        raw_text = await self.generate(prompt=prompt, system_prompt=json_sys)
        
        # Extract JSON block if enclosed in ```json ... ```
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if match:
            raw_text = match.group(1)

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Attempt sub-string object extraction
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            if start != -1 and end != -1:
                try:
                    return json.loads(raw_text[start : end + 1])
                except Exception:
                    pass
            logger.warning("Ollama JSON parsing failed. Raw response: %s", raw_text)
            return {"error": "Failed to parse JSON", "raw": raw_text}

    async def is_available(self) -> bool:
        """Check if Ollama service is reachable."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False
