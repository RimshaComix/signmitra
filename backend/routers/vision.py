from fastapi import APIRouter, HTTPException
from backend.schemas.vision import VisionAnalyzeRequest, VisionAnalyzeResponse
from backend.services.ocr_service import ocr_service

router = APIRouter(prefix="/vision", tags=["Vision & OCR"])

@router.post("/analyze", response_model=VisionAnalyzeResponse)
async def analyze_vision(req: VisionAnalyzeRequest):
    """
    Validates, decodes, and analyzes uploaded images (notices, token slips, forms).
    """
    try:
        result = await ocr_service.analyze_image(req.image_base64, mode=req.mode)
        return VisionAnalyzeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal image processing error: {str(e)}")
