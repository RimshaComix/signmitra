from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class VisionAnalyzeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string (with or without data URI prefix)")
    mode: str = Field("notice", description="Analysis mode: 'notice', 'token', 'form', or 'general'")

class VisionAnalyzeResponse(BaseModel):
    extracted_text: str
    detected_type: str
    structured_fields: Dict[str, Any]
    confidence_note: str
    is_interpreted_by_ai: bool
    engine: str
    provenance: Optional[str] = None
    live_inference_blocked: bool = False
    validation_details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    disclaimer: Optional[str] = None
    has_readable_text: Optional[bool] = None

