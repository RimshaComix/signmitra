from typing import List, Optional
from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_language: str = Field("Hindi", description="Target language, e.g., Hindi, Marathi, Tamil, Bengali, Telugu, Kannada")
    preserve_formatting: bool = True
    mode: Optional[str] = "ai"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str
    pronunciation_guide: Optional[str] = None
    engine: str
    provenance: Optional[str] = None
    is_ai: bool = True
    live_inference_blocked: bool = False
    error: Optional[str] = None

class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_level: str = Field("grade5", description="Target reading level: grade3, grade5, grade8, simpler, shorter, step_by_step, key_points, formal")

class SimplifyResponse(BaseModel):
    original_text: str
    simplified_text: str
    reading_level: str
    key_points: List[str]
    engine: str
    provenance: Optional[str] = None
    is_ai: bool = False
    live_inference_blocked: bool = False
    error: Optional[str] = None

class LanguageDetectRequest(BaseModel):
    text: str = Field(..., min_length=1)

class LanguageDetectResponse(BaseModel):
    detected: bool
    language_name: Optional[str] = None
    language_code: Optional[str] = None
    confidence: Optional[float] = None
    engine: str
    provenance: str
    live_inference_blocked: bool = False
    error: Optional[str] = None

