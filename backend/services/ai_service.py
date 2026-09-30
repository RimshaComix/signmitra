import logging
from typing import Optional, Dict, Any

from backend.services.ai_provider import (
    get_ai_provider,
    BaseAIProvider,
    AIProviderNotConfiguredException,
    AIProviderExecutionError
)

logger = logging.getLogger("signmitra.ai")

class GeminiService:
    """
    Unified AI service layer delegating to the active provider (Gemini, Groq, Cerebras, OpenAI, Ollama).
    Maintains full backward compatibility while supporting provider-independence.
    """
    def __init__(self):
        self._provider: BaseAIProvider = get_ai_provider()

    def reload_provider(self):
        self._provider = get_ai_provider()

    @property
    def provider(self) -> BaseAIProvider:
        return self._provider

    def is_configured(self) -> bool:
        return self._provider.is_configured()

    def get_provider_status(self) -> Dict[str, Any]:
        return self._provider.get_status()

    async def generate_structured_json(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        return await self._provider.generate_json(prompt, system_instruction)

    async def generate_text(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None
    ) -> str:
        return await self._provider.generate_text(prompt, system_instruction)

    async def analyze_image_with_vision(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:
        return await self._provider.analyze_image(image_bytes, mime_type, prompt)

gemini_service = GeminiService()
