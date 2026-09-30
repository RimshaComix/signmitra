from typing import Optional
from pydantic import BaseModel, Field

class ComposeCardRequest(BaseModel):
    intent: str = Field(..., description="User's intended message")
    domain: Optional[str] = "General"
    notes: Optional[str] = None
    polite_level: Optional[str] = "polite" # standard, polite, urgent

class ComposeCardResponse(BaseModel):
    card_text: str
    polite_level: str
    domain: str
    suggested_translations: Optional[dict] = None
    engine: str
    provenance: Optional[str] = None
    error: Optional[str] = None

class RewriteTextRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Original user text to rewrite")
    mode: str = Field("polite", description="Mode: polite, clear, urgent, simpler")
    domain: Optional[str] = "General"

class RewriteTextResponse(BaseModel):
    original_text: str
    transformed_text: str
    mode: str
    engine: str
    provenance: str
    error: Optional[str] = None
    live_inference_blocked: bool = False

class TranslateTextRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Original text to translate")
    target_language: str = Field(..., min_length=1, description="Target language (e.g. Hindi, hi, Tamil, ta)")
    source_language: Optional[str] = "en"
    mode: Optional[str] = "ai"  # "ai" for live LLM translation, "deterministic" for curated phrasebook

class TranslateTextResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str
    source_language: str
    engine: str
    provenance: str
    is_ai: bool
    pronunciation_guide: Optional[str] = None
    live_inference_blocked: bool = False
    error: Optional[str] = None
