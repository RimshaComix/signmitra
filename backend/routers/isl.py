from typing import Optional
from fastapi import APIRouter, Query
from backend.services.isl_service import isl_service

router = APIRouter(prefix="/isl", tags=["ISL Recognition Pipeline"])

@router.get("/status")
def get_isl_status():
    """
    Returns the real pipeline status, checkpoint detection, and evaluation metrics.
    """
    return isl_service.get_pipeline_status()

@router.get("/catalog")
def get_isl_catalog(query: Optional[str] = Query(None)):
    """
    Returns verified ISLRTC standard functional signs.
    """
    return isl_service.get_reference_catalog(query or "")

@router.post("/recognize")
def recognize_signs(payload: dict):
    """
    Inference endpoint. Strictly reports requirement of validated model checkpoint without fabricating outputs.
    """
    return isl_service.process_frames_or_landmarks(payload)
