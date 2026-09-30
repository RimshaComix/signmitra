import os
import json
import base64
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx

from backend.config import settings

logger = logging.getLogger("signmitra.ai_provider")

class AIProviderException(Exception):
    """Base exception for AI provider errors."""
    pass

class AIProviderNotConfiguredException(AIProviderException):
    """Raised when an AI operation is called but no provider key is available."""
    pass

class AIProviderExecutionError(AIProviderException):
    """Raised when the AI model returns an error, timeout, or invalid output."""
    pass

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
    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        pass

    @abstractmethod
    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        pass


# =====================================================================
# 1. Google Gemini Adapter (using official google-genai SDK)
# =====================================================================
class GeminiAdapter(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")
        self._model = model or os.getenv("AI_MODEL") or "gemini-1.5-flash"
        self._client = None
        if self._api_key and len(self._api_key.strip()) > 5:
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key.strip())
            except Exception as e:
                logger.error("Failed to initialize Google GenAI client: %s", str(e))
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
            "status_message": "Ready" if self.is_configured() else "GEMINI_API_KEY not configured. Set GEMINI_API_KEY or AI_API_KEY in backend/.env."
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"healthy": False, "error": "Not configured"}
        try:
            res = await self.generate_text("Reply with: OK")
            return {"healthy": "OK" in res or len(res) > 0, "response": res.strip()}
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Gemini is not configured. Provide GEMINI_API_KEY.")
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
            raise AIProviderExecutionError(f"Gemini generation error: {str(e)}")

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Gemini is not configured. Provide GEMINI_API_KEY.")
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
            return json.loads(raw)
        except json.JSONDecodeError:
            raise AIProviderExecutionError("Gemini response was not valid JSON.")
        except Exception as e:
            raise AIProviderExecutionError(f"Gemini JSON generation error: {str(e)}")

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Gemini Vision requires GEMINI_API_KEY.")
        try:
            from google.genai import types
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
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
        except Exception as e:
            raise AIProviderExecutionError(f"Gemini Vision analysis error: {str(e)}")


# =====================================================================
# 2. Groq Adapter (Fast inference with generous free tier)
# =====================================================================
class GroqAdapter(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY")
        self._model = model or os.getenv("AI_MODEL") or "llama-3.3-70b-versatile"
        self._vision_model = "llama-3.2-11b-vision-preview"
        self._endpoint = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": "Ready" if self.is_configured() else "GROQ_API_KEY not configured. Set GROQ_API_KEY in backend/.env."
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"healthy": False, "error": "Not configured"}
        try:
            res = await self.generate_text("Reply with: OK")
            return {"healthy": "OK" in res or len(res) > 0, "response": res.strip()}
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Groq is not configured. Provide GROQ_API_KEY.")
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.3
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": f"Bearer {self._api_key.strip()}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Groq API error ({res.status_code}): {res.text}")
                data = res.json()
                return data["choices"][0]["message"]["content"]
            except httpx.TimeoutException:
                raise AIProviderExecutionError("Groq API request timed out.")
            except Exception as e:
                raise AIProviderExecutionError(f"Groq invocation failed: {str(e)}")

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Groq is not configured. Provide GROQ_API_KEY.")

        messages = []
        sys = (system_instruction or "") + "\nYou MUST reply with a valid JSON object only."
        messages.append({"role": "system", "content": sys.strip()})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": f"Bearer {self._api_key.strip()}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Groq API error ({res.status_code}): {res.text}")
                data = res.json()
                raw = data["choices"][0]["message"]["content"]
                return json.loads(raw)
            except json.JSONDecodeError:
                raise AIProviderExecutionError("Groq response was not valid JSON.")
            except Exception as e:
                raise AIProviderExecutionError(f"Groq JSON invocation failed: {str(e)}")

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Groq Vision requires GROQ_API_KEY.")
        
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"

        payload = {
            "model": self._vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt + "\nReturn a valid JSON object."},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post(
                    self._endpoint,
                    headers={
                        "Authorization": f"Bearer {self._api_key.strip()}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Groq Vision error ({res.status_code}): {res.text}")
                data = res.json()
                raw = data["choices"][0]["message"]["content"]
                return json.loads(raw)
            except Exception as e:
                raise AIProviderExecutionError(f"Groq Vision analysis failed: {str(e)}")


# =====================================================================
# 3. Cerebras Adapter (Ultra-fast inference)
# =====================================================================
class CerebrasAdapter(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("CEREBRAS_API_KEY") or os.getenv("AI_API_KEY")
        self._model = model or os.getenv("AI_MODEL") or "llama3.1-8b"
        self._endpoint = "https://api.cerebras.ai/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "cerebras"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": "Ready" if self.is_configured() else "CEREBRAS_API_KEY not configured. Set CEREBRAS_API_KEY in backend/.env."
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"healthy": False, "error": "Not configured"}
        try:
            res = await self.generate_text("Reply with: OK")
            return {"healthy": "OK" in res or len(res) > 0, "response": res.strip()}
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Cerebras is not configured. Provide CEREBRAS_API_KEY.")
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self._endpoint,
                headers={"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": 0.3}
            )
            if res.status_code != 200:
                raise AIProviderExecutionError(f"Cerebras error ({res.status_code}): {res.text}")
            return res.json()["choices"][0]["message"]["content"]

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("Cerebras is not configured. Provide CEREBRAS_API_KEY.")
        messages = []
        sys = (system_instruction or "") + "\nYou MUST reply with a valid JSON object only."
        messages.append({"role": "system", "content": sys.strip()})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self._endpoint,
                headers={"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": 0.2, "response_format": {"type": "json_object"}}
            )
            if res.status_code != 200:
                raise AIProviderExecutionError(f"Cerebras error ({res.status_code}): {res.text}")
            return json.loads(res.json()["choices"][0]["message"]["content"])

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        raise AIProviderExecutionError("Cerebras does not currently support image vision inference. Use Gemini or Groq vision.")


# =====================================================================
# 4. OpenAI Adapter (Standard / GPT-4o-mini)
# =====================================================================
class OpenAIAdapter(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")
        self._model = model or os.getenv("AI_MODEL") or "gpt-4o-mini"
        self._endpoint = "https://api.openai.com/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": "Ready" if self.is_configured() else "OPENAI_API_KEY not configured. Set OPENAI_API_KEY in backend/.env."
        }

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"healthy": False, "error": "Not configured"}
        try:
            res = await self.generate_text("Reply with: OK")
            return {"healthy": "OK" in res or len(res) > 0, "response": res.strip()}
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("OpenAI is not configured. Provide OPENAI_API_KEY.")
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self._endpoint,
                headers={"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": 0.3}
            )
            if res.status_code != 200:
                raise AIProviderExecutionError(f"OpenAI error ({res.status_code}): {res.text}")
            return res.json()["choices"][0]["message"]["content"]

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("OpenAI is not configured. Provide OPENAI_API_KEY.")
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self._endpoint,
                headers={"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": 0.2, "response_format": {"type": "json_object"}}
            )
            if res.status_code != 200:
                raise AIProviderExecutionError(f"OpenAI error ({res.status_code}): {res.text}")
            return json.loads(res.json()["choices"][0]["message"]["content"])

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        if not self.is_configured():
            raise AIProviderNotConfiguredException("OpenAI Vision requires OPENAI_API_KEY.")
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt + "\nReturn a valid JSON object."},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self._endpoint,
                headers={"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"},
                json=payload
            )
            if res.status_code != 200:
                raise AIProviderExecutionError(f"OpenAI Vision error ({res.status_code}): {res.text}")
            return json.loads(res.json()["choices"][0]["message"]["content"])


# =====================================================================
# 5. Local Ollama Adapter (100% Offline, Private, Free)
# =====================================================================
class OllamaAdapter(BaseAIProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").rstrip("/")
        self._model = model or os.getenv("AI_MODEL") or "llama3.2"

    @property
    def provider_name(self) -> str:
        return "ollama_local"

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        # Check if local endpoint is configured
        return bool(self._base_url)

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": self.is_configured(),
            "status_message": f"Local Ollama at {self._base_url} (Requires 'ollama serve')"
        }

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self._base_url}/api/tags")
                return {"healthy": res.status_code == 200, "models": res.json().get("models", [])}
        except Exception as e:
            return {"healthy": False, "error": f"Ollama not running: {str(e)}"}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        payload = {
            "model": self._model,
            "prompt": prompt,
            "system": system_instruction or "",
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(f"{self._base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Ollama error ({res.status_code}): {res.text}")
                return res.json().get("response", "")
            except Exception as e:
                raise AIProviderExecutionError(f"Ollama call failed: {str(e)}")

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        payload = {
            "model": self._model,
            "prompt": prompt,
            "system": system_instruction or "",
            "format": "json",
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(f"{self._base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Ollama error ({res.status_code}): {res.text}")
                raw = res.json().get("response", "{}")
                return json.loads(raw)
            except Exception as e:
                raise AIProviderExecutionError(f"Ollama JSON call failed: {str(e)}")

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "model": self._model,
            "prompt": prompt,
            "images": [b64],
            "format": "json",
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(f"{self._base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise AIProviderExecutionError(f"Ollama Vision error ({res.status_code}): {res.text}")
                raw = res.json().get("response", "{}")
                return json.loads(raw)
            except Exception as e:
                raise AIProviderExecutionError(f"Ollama Vision call failed: {str(e)}")


# =====================================================================
# 6. Unconfigured Provider (Truthful Fallback)
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
                "No AI provider key is configured. To enable live inference, set ONE of: "
                "GROQ_API_KEY (Free at console.groq.com), "
                "GEMINI_API_KEY (Free at aistudio.google.com), "
                "CEREBRAS_API_KEY (Free at cloud.cerebras.ai), "
                "or OPENAI_API_KEY in backend/.env"
            )
        }

    async def health_check(self) -> Dict[str, Any]:
        return {"healthy": False, "error": "No AI Provider Key Configured"}

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        raise AIProviderNotConfiguredException(self.get_status()["status_message"])

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        raise AIProviderNotConfiguredException(self.get_status()["status_message"])

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> Dict[str, Any]:
        raise AIProviderNotConfiguredException(self.get_status()["status_message"])


# =====================================================================
# Provider Factory & Global Singleton Resolver
# =====================================================================
def get_ai_provider() -> BaseAIProvider:
    """
    Resolves the appropriate AI provider based on AI_PROVIDER environment variable
    or auto-detects based on available API keys.
    """
    configured_provider = os.getenv("AI_PROVIDER", "").lower().strip()

    if configured_provider == "groq" or (not configured_provider and os.getenv("GROQ_API_KEY")):
        adapter = GroqAdapter()
        if adapter.is_configured():
            return adapter

    if configured_provider in ("gemini", "google") or (not configured_provider and os.getenv("GEMINI_API_KEY")):
        adapter = GeminiAdapter()
        if adapter.is_configured():
            return adapter

    if configured_provider == "cerebras" or (not configured_provider and os.getenv("CEREBRAS_API_KEY")):
        adapter = CerebrasAdapter()
        if adapter.is_configured():
            return adapter

    if configured_provider == "openai" or (not configured_provider and os.getenv("OPENAI_API_KEY")):
        adapter = OpenAIAdapter()
        if adapter.is_configured():
            return adapter

    if configured_provider == "ollama":
        return OllamaAdapter()

    # If AI_API_KEY was provided generically without AI_PROVIDER specified:
    generic_key = os.getenv("AI_API_KEY", "").strip()
    if generic_key:
        if generic_key.startswith("gsk_"):
            return GroqAdapter(api_key=generic_key)
        elif generic_key.startswith("csk-"):
            return CerebrasAdapter(api_key=generic_key)
        elif generic_key.startswith("sk-"):
            return OpenAIAdapter(api_key=generic_key)
        else:
            return GeminiAdapter(api_key=generic_key)

    return UnconfiguredProvider()

ai_provider = get_ai_provider()
