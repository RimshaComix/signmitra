from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config import settings
from backend.database import get_db
from backend.services.ai_service import gemini_service
from backend.services.isl_service import isl_service

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db_ok else "disconnected",
        "ai_provider": gemini_service.get_provider_status(),
        "isl_engine": isl_service.get_pipeline_status()["status"]
    }

@router.get("/status")
def get_detailed_status(db: Session = Depends(get_db)):
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": gemini_service.get_provider_status(),
        "isl_pipeline": isl_service.get_pipeline_status(),
        "database_url": "sqlite:///signmitra.db"
    }
