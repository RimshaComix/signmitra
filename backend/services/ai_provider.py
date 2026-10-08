import os
import json
import base64
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

import httpx

from backend.config import settings


logger = logging.getLogger("signmitra.ai_provider")


# =====================================================================
# Exceptions
# =====================================================================

class AIProviderException(Exception):
    """Base exception for AI provider errors."""
    pass


class AIProviderNotConfiguredException(AIProviderException):
    """Raised when an AI operation is called but no provider key is available."""
    pass


class AIProviderExecutionError(AIProviderException):
    """Raised when the AI provider returns an error or invalid output."""
    pass


# =====================================================================
# Base Provider
# =====================================================================

class BaseAIProvider(ABC):
    """Abstract base class for all AI provider adapters."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        pass


# =====================================================================
# 1. Google Gemini Adapter
# =====================================================================

class GeminiAdapter(BaseAIProvider):

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self._api_key = (
            api_key
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("AI_API_KEY")
        )

        self._model = (
            model
            or os.getenv("AI_MODEL")
            or "gemini-1.5-flash"
        )

        self._client = None

        if self._api_key and len(self._api_key.strip()) > 5:
            try:
                from google import genai

                self._client = genai.Client(
                    api_key=self._api_key.strip()
                )

            except Exception as e:
                logger.error(
                    "Failed to initialize Google GenAI client: %s",
                    str(e)
                )
                self._client = None

    @property
    def provider_name(self) -> str:
        return "google_gemini"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return self._client is not None

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": (
                "Ready"
                if self.is_configured()
                else (
                    "GEMINI_API_KEY not configured. "
                    "Set GEMINI_API_KEY or AI_API_KEY in backend/.env."
                )
            )
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "healthy": False,
                "error": "Not configured"
            }

        try:
            response = await self.generate_text("Reply with: OK")

            return {
                "healthy": bool(response.strip()),
                "response": response.strip()
            }

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e)
            }

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Gemini is not configured. Provide GEMINI_API_KEY."
            )

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=0.3,
                system_instruction=system_instruction
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=config
            )

            return response.text or ""

        except Exception as e:
            raise AIProviderExecutionError(
                f"Gemini generation error: {str(e)}"
            ) from e

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Gemini is not configured. Provide GEMINI_API_KEY."
            )

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                system_instruction=system_instruction
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=config
            )

            raw = response.text or "{}"

            try:
                return json.loads(raw)

            except json.JSONDecodeError as e:
                raise AIProviderExecutionError(
                    "Gemini response was not valid JSON."
                ) from e

        except AIProviderExecutionError:
            raise

        except Exception as e:
            raise AIProviderExecutionError(
                f"Gemini JSON generation error: {str(e)}"
            ) from e

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Gemini Vision requires GEMINI_API_KEY."
            )

        try:
            from google.genai import types

            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            )

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=[prompt, image_part],
                config=config
            )

            raw = response.text or "{}"

            return json.loads(raw)

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "Gemini Vision response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"Gemini Vision analysis error: {str(e)}"
            ) from e


# =====================================================================
# 2. Groq Adapter
# =====================================================================

class GroqAdapter(BaseAIProvider):

    # Current production model suitable for general text/JSON workloads.
    DEFAULT_MODEL = "openai/gpt-oss-120b"

    # Current multimodal model for image analysis.
    DEFAULT_VISION_MODEL = "qwen/qwen3.8-27b"

    ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self._api_key = (
            api_key
            or os.getenv("GROQ_API_KEY")
            or os.getenv("AI_API_KEY")
        )

        self._model = (
            model
            or os.getenv("AI_MODEL")
            or self.DEFAULT_MODEL
        )

        self._vision_model = self.DEFAULT_VISION_MODEL
        self._endpoint = self.ENDPOINT

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(
            self._api_key
            and len(self._api_key.strip()) > 5
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": (
                "Ready"
                if self.is_configured()
                else (
                    "GROQ_API_KEY not configured. "
                    "Set GROQ_API_KEY in backend/.env."
                )
            )
        }

    # -----------------------------------------------------------------
    # Shared Groq request helper
    # -----------------------------------------------------------------

    async def _post_chat(
        self,
        payload: Dict[str, Any],
        operation: str
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Groq is not configured. Provide GROQ_API_KEY."
            )

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

        except httpx.TimeoutException as e:
            logger.error(
                "Groq %s request timed out. model=%s",
                operation,
                payload.get("model")
            )

            raise AIProviderExecutionError(
                "Groq API request timed out."
            ) from e

        except httpx.HTTPError as e:
            logger.error(
                "Groq %s HTTP error: %s",
                operation,
                str(e)
            )

            raise AIProviderExecutionError(
                f"Groq HTTP request failed: {str(e)}"
            ) from e

        if response.status_code != 200:
            logger.error(
                "Groq API error: operation=%s status=%s model=%s body=%s",
                operation,
                response.status_code,
                payload.get("model"),
                response.text
            )

            raise AIProviderExecutionError(
                f"Groq API error ({response.status_code}): "
                f"{response.text}"
            )

        try:
            return response.json()

        except json.JSONDecodeError as e:
            logger.error(
                "Groq returned invalid JSON: %s",
                response.text
            )

            raise AIProviderExecutionError(
                "Groq returned an invalid JSON response."
            ) from e

    # -----------------------------------------------------------------
    # Health check
    # -----------------------------------------------------------------

    async def health_check(self) -> Dict[str, Any]:

        if not self.is_configured():
            return {
                "healthy": False,
                "error": "Not configured"
            }

        try:
            response = await self.generate_text(
                "Reply with exactly: OK"
            )

            return {
                "healthy": bool(response.strip()),
                "response": response.strip(),
                "provider": self.provider_name,
                "model": self.model_name
            }

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "provider": self.provider_name,
                "model": self.model_name
            }

    # -----------------------------------------------------------------
    # Text generation
    # -----------------------------------------------------------------

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Groq is not configured. Provide GROQ_API_KEY."
            )

        messages = []

        if system_instruction:
            messages.append({
                "role": "system",
                "content": system_instruction
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.3
        }

        data = await self._post_chat(
            payload,
            operation="text_generation"
        )

        try:
            content = data["choices"][0]["message"]["content"]

            if not isinstance(content, str):
                raise TypeError("Groq content was not a string.")

            return content

        except (KeyError, IndexError, TypeError) as e:
            logger.error(
                "Unexpected Groq text response: %s",
                data
            )

            raise AIProviderExecutionError(
                f"Unexpected Groq response structure: {data}"
            ) from e

    # -----------------------------------------------------------------
    # JSON generation
    # -----------------------------------------------------------------

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Groq is not configured. Provide GROQ_API_KEY."
            )

        system_prompt = (
            (system_instruction or "").strip()
            + "\nYou MUST reply with a valid JSON object only."
        ).strip()

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {
                "type": "json_object"
            }
        }

        data = await self._post_chat(
            payload,
            operation="json_generation"
        )

        try:
            raw = data["choices"][0]["message"]["content"]

        except (KeyError, IndexError, TypeError) as e:
            logger.error(
                "Unexpected Groq JSON response: %s",
                data
            )

            raise AIProviderExecutionError(
                f"Unexpected Groq JSON response structure: {data}"
            ) from e

        try:
            parsed = json.loads(raw)

        except json.JSONDecodeError as e:
            logger.error(
                "Groq returned invalid JSON content: %s",
                raw
            )

            raise AIProviderExecutionError(
                "Groq response was not valid JSON."
            ) from e

        if not isinstance(parsed, dict):
            raise AIProviderExecutionError(
                "Groq JSON response was not a JSON object."
            )

        return parsed

    # -----------------------------------------------------------------
    # Vision / Image analysis
    # -----------------------------------------------------------------

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Groq Vision requires GROQ_API_KEY."
            )

        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"

        payload = {
            "model": self._vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                prompt
                                + "\nReturn a valid JSON object only."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": data_uri
                            }
                        }
                    ]
                }
            ],
            "response_format": {
                "type": "json_object"
            },
            "temperature": 0.1
        }

        data = await self._post_chat(
            payload,
            operation="vision"
        )

        try:
            raw = data["choices"][0]["message"]["content"]

        except (KeyError, IndexError, TypeError) as e:
            logger.error(
                "Unexpected Groq Vision response: %s",
                data
            )

            raise AIProviderExecutionError(
                f"Unexpected Groq Vision response structure: {data}"
            ) from e

        try:
            parsed = json.loads(raw)

        except json.JSONDecodeError as e:
            logger.error(
                "Groq Vision returned invalid JSON: %s",
                raw
            )

            raise AIProviderExecutionError(
                "Groq Vision response was not valid JSON."
            ) from e

        if not isinstance(parsed, dict):
            raise AIProviderExecutionError(
                "Groq Vision response was not a JSON object."
            )

        return parsed


# =====================================================================
# 3. Cerebras Adapter
# =====================================================================

class CerebrasAdapter(BaseAIProvider):

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self._api_key = (
            api_key
            or os.getenv("CEREBRAS_API_KEY")
            or os.getenv("AI_API_KEY")
        )

        self._model = (
            model
            or os.getenv("AI_MODEL")
            or "llama3.1-8b"
        )

        self._endpoint = "https://api.cerebras.ai/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "cerebras"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(
            self._api_key
            and len(self._api_key.strip()) > 5
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": (
                "Ready"
                if self.is_configured()
                else (
                    "CEREBRAS_API_KEY not configured. "
                    "Set CEREBRAS_API_KEY in backend/.env."
                )
            )
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "healthy": False,
                "error": "Not configured"
            }

        try:
            response = await self.generate_text("Reply with: OK")

            return {
                "healthy": bool(response.strip()),
                "response": response.strip()
            }

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e)
            }

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Cerebras is not configured. Provide CEREBRAS_API_KEY."
            )

        messages = []

        if system_instruction:
            messages.append({
                "role": "system",
                "content": system_instruction
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.3
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"Cerebras error ({response.status_code}): "
                    f"{response.text}"
                )

            return response.json()["choices"][0]["message"]["content"]

        except AIProviderExecutionError:
            raise

        except Exception as e:
            raise AIProviderExecutionError(
                f"Cerebras call failed: {str(e)}"
            ) from e

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "Cerebras is not configured. Provide CEREBRAS_API_KEY."
            )

        system_prompt = (
            (system_instruction or "").strip()
            + "\nYou MUST reply with a valid JSON object only."
        ).strip()

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {
                "type": "json_object"
            }
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"Cerebras error ({response.status_code}): "
                    f"{response.text}"
                )

            raw = response.json()["choices"][0]["message"]["content"]

            return json.loads(raw)

        except AIProviderExecutionError:
            raise

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "Cerebras response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"Cerebras JSON call failed: {str(e)}"
            ) from e

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:

        raise AIProviderExecutionError(
            "Cerebras does not currently support image vision inference. "
            "Use Gemini or Groq vision."
        )


# =====================================================================
# 4. OpenAI Adapter
# =====================================================================

class OpenAIAdapter(BaseAIProvider):

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self._api_key = (
            api_key
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("AI_API_KEY")
        )

        self._model = (
            model
            or os.getenv("AI_MODEL")
            or "gpt-4o-mini"
        )

        self._endpoint = (
            "https://api.openai.com/v1/chat/completions"
        )

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(
            self._api_key
            and len(self._api_key.strip()) > 5
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": (
                "Ready"
                if self.is_configured()
                else (
                    "OPENAI_API_KEY not configured. "
                    "Set OPENAI_API_KEY in backend/.env."
                )
            )
        }

    async def health_check(self) -> Dict[str, Any]:

        if not self.is_configured():
            return {
                "healthy": False,
                "error": "Not configured"
            }

        try:
            response = await self.generate_text(
                "Reply with: OK"
            )

            return {
                "healthy": bool(response.strip()),
                "response": response.strip()
            }

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e)
            }

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "OpenAI is not configured. Provide OPENAI_API_KEY."
            )

        messages = []

        if system_instruction:
            messages.append({
                "role": "system",
                "content": system_instruction
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.3
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"OpenAI error ({response.status_code}): "
                    f"{response.text}"
                )

            return response.json()["choices"][0]["message"]["content"]

        except AIProviderExecutionError:
            raise

        except Exception as e:
            raise AIProviderExecutionError(
                f"OpenAI call failed: {str(e)}"
            ) from e

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "OpenAI is not configured. Provide OPENAI_API_KEY."
            )

        messages = []

        if system_instruction:
            messages.append({
                "role": "system",
                "content": system_instruction
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {
                "type": "json_object"
            }
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"OpenAI error ({response.status_code}): "
                    f"{response.text}"
                )

            raw = response.json()["choices"][0]["message"]["content"]

            return json.loads(raw)

        except AIProviderExecutionError:
            raise

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "OpenAI response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"OpenAI JSON call failed: {str(e)}"
            ) from e

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:

        if not self.is_configured():
            raise AIProviderNotConfiguredException(
                "OpenAI Vision requires OPENAI_API_KEY."
            )

        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                prompt
                                + "\nReturn a valid JSON object."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": data_uri
                            }
                        }
                    ]
                }
            ],
            "response_format": {
                "type": "json_object"
            },
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key.strip()}"
                        ),
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"OpenAI Vision error ({response.status_code}): "
                    f"{response.text}"
                )

            return json.loads(
                response.json()["choices"][0]["message"]["content"]
            )

        except AIProviderExecutionError:
            raise

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "OpenAI Vision response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"OpenAI Vision call failed: {str(e)}"
            ) from e


# =====================================================================
# 5. Local Ollama Adapter
# =====================================================================

class OllamaAdapter(BaseAIProvider):

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None
    ):
        self._base_url = (
            base_url
            or os.getenv("OLLAMA_BASE_URL")
            or "http://localhost:11434"
        ).rstrip("/")

        self._model = (
            model
            or os.getenv("AI_MODEL")
            or "llama3.2"
        )

    @property
    def provider_name(self) -> str:
        return "ollama_local"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._base_url)

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": (
                f"Local Ollama at {self._base_url} "
                "(Requires 'ollama serve')"
            )
        }

    async def health_check(self) -> Dict[str, Any]:

        try:
            async with httpx.AsyncClient(
                timeout=3.0
            ) as client:

                response = await client.get(
                    f"{self._base_url}/api/tags"
                )

            return {
                "healthy": response.status_code == 200,
                "models": (
                    response.json().get("models", [])
                    if response.status_code == 200
                    else []
                )
            }

        except Exception as e:
            return {
                "healthy": False,
                "error": f"Ollama not running: {str(e)}"
            }

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:

        payload = {
            "model": self._model,
            "prompt": prompt,
            "system": system_instruction or "",
            "stream": False
        }

        try:
            async with httpx.AsyncClient(
                timeout=60.0
            ) as client:

                response = await client.post(
                    f"{self._base_url}/api/generate",
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"Ollama error ({response.status_code}): "
                    f"{response.text}"
                )

            return response.json().get("response", "")

        except AIProviderExecutionError:
            raise

        except Exception as e:
            raise AIProviderExecutionError(
                f"Ollama call failed: {str(e)}"
            ) from e

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        payload = {
            "model": self._model,
            "prompt": prompt,
            "system": system_instruction or "",
            "format": "json",
            "stream": False
        }

        try:
            async with httpx.AsyncClient(
                timeout=60.0
            ) as client:

                response = await client.post(
                    f"{self._base_url}/api/generate",
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"Ollama error ({response.status_code}): "
                    f"{response.text}"
                )

            raw = response.json().get(
                "response",
                "{}"
            )

            return json.loads(raw)

        except AIProviderExecutionError:
            raise

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "Ollama response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"Ollama JSON call failed: {str(e)}"
            ) from e

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:

        b64 = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "model": self._model,
            "prompt": prompt,
            "images": [b64],
            "format": "json",
            "stream": False
        }

        try:
            async with httpx.AsyncClient(
                timeout=60.0
            ) as client:

                response = await client.post(
                    f"{self._base_url}/api/generate",
                    json=payload
                )

            if response.status_code != 200:
                raise AIProviderExecutionError(
                    f"Ollama Vision error ({response.status_code}): "
                    f"{response.text}"
                )

            raw = response.json().get(
                "response",
                "{}"
            )

            return json.loads(raw)

        except AIProviderExecutionError:
            raise

        except json.JSONDecodeError as e:
            raise AIProviderExecutionError(
                "Ollama Vision response was not valid JSON."
            ) from e

        except Exception as e:
            raise AIProviderExecutionError(
                f"Ollama Vision call failed: {str(e)}"
            ) from e


# =====================================================================
# 6. Unconfigured Provider
# =====================================================================

class UnconfiguredProvider(BaseAIProvider):

    @property
    def provider_name(self) -> str:
        return "unconfigured"

    @property
    def model_name(self) -> str:
        return "none"

    def is_configured(self) -> bool:
        return False

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": "unconfigured",
            "model": "none",
            "configured": False,
            "status_message": (
                "No AI provider key is configured. "
                "To enable live inference, set ONE of: "
                "GROQ_API_KEY, GEMINI_API_KEY, "
                "CEREBRAS_API_KEY, or OPENAI_API_KEY "
                "in backend/.env."
            )
        }

    async def health_check(self) -> Dict[str, Any]:
        return {
            "healthy": False,
            "error": "No AI Provider Key Configured"
        }

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        raise AIProviderNotConfiguredException(
            self.get_status()["status_message"]
        )

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        raise AIProviderNotConfiguredException(
            self.get_status()["status_message"]
        )

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str
    ) -> Dict[str, Any]:
        raise AIProviderNotConfiguredException(
            self.get_status()["status_message"]
        )


# =====================================================================
# Provider Factory
# =====================================================================

def get_ai_provider() -> BaseAIProvider:
    """
    Resolve the active AI provider.

    Priority:
    1. Explicit AI_PROVIDER
    2. Provider-specific API keys
    3. Generic AI_API_KEY
    4. Truthful unconfigured fallback
    """

    configured_provider = (
        getattr(settings, "AI_PROVIDER", None)
        or os.getenv("AI_PROVIDER", "")
    ).lower().strip()

    ai_model = (
        getattr(settings, "AI_MODEL", None)
        or os.getenv("AI_MODEL", "")
    ).strip() or None

    gemini_key = (
        getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEY", "")
    ).strip()

    groq_key = (
        getattr(settings, "GROQ_API_KEY", None)
        or os.getenv("GROQ_API_KEY", "")
    ).strip()

    cerebras_key = (
        getattr(settings, "CEREBRAS_API_KEY", None)
        or os.getenv("CEREBRAS_API_KEY", "")
    ).strip()

    openai_key = (
        getattr(settings, "OPENAI_API_KEY", None)
        or os.getenv("OPENAI_API_KEY", "")
    ).strip()

    generic_key = (
        getattr(settings, "AI_API_KEY", None)
        or os.getenv("AI_API_KEY", "")
    ).strip()

    # -------------------------------------------------------------
    # Explicit provider selection
    # -------------------------------------------------------------

    if configured_provider in ("gemini", "google"):
        adapter = GeminiAdapter(
            api_key=gemini_key or generic_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if configured_provider == "groq":
        adapter = GroqAdapter(
            api_key=groq_key or generic_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if configured_provider == "cerebras":
        adapter = CerebrasAdapter(
            api_key=cerebras_key or generic_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if configured_provider == "openai":
        adapter = OpenAIAdapter(
            api_key=openai_key or generic_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if configured_provider == "ollama":
        return OllamaAdapter(
            model=ai_model
        )

    # -------------------------------------------------------------
    # Automatic provider detection
    # -------------------------------------------------------------

    if groq_key:
        adapter = GroqAdapter(
            api_key=groq_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if gemini_key:
        adapter = GeminiAdapter(
            api_key=gemini_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if cerebras_key:
        adapter = CerebrasAdapter(
            api_key=cerebras_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    if openai_key:
        adapter = OpenAIAdapter(
            api_key=openai_key,
            model=ai_model
        )

        if adapter.is_configured():
            return adapter

    # -------------------------------------------------------------
    # Generic AI_API_KEY
    # -------------------------------------------------------------

    if generic_key:

        if generic_key.startswith("gsk_"):
            return GroqAdapter(
                api_key=generic_key,
                model=ai_model
            )

        if generic_key.startswith("csk-"):
            return CerebrasAdapter(
                api_key=generic_key,
                model=ai_model
            )

        if generic_key.startswith("sk-"):
            return OpenAIAdapter(
                api_key=generic_key,
                model=ai_model
            )

        return GeminiAdapter(
            api_key=generic_key,
            model=ai_model
        )

    return UnconfiguredProvider()


# =====================================================================
# Global Provider Singleton
# =====================================================================

ai_provider = get_ai_provider()