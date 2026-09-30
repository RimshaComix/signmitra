from fastapi import APIRouter, HTTPException
from backend.schemas.language import (
    TranslateRequest,
    TranslateResponse,
    SimplifyRequest,
    SimplifyResponse
)
from backend.services.translation_service import translation_service

router = APIRouter(prefix="/language", tags=["Language Tools"])

@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    """
    Translates communication text into an Indian language (Hindi, Marathi, Tamil, Bengali, Telugu, Kannada).
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        res = await translation_service.translate(req.text, req.target_language)
        return TranslateResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

@router.post("/simplify", response_model=SimplifyResponse)
async def simplify_text(req: SimplifyRequest):
    """
    Simplifies dense institutional, administrative, or legal text into accessible plain language.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        res = await translation_service.simplify_reading_level(req.text, req.target_level)
        return SimplifyResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simplification error: {str(e)}")
