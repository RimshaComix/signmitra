from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.settings import SettingsModel
from backend.schemas.settings import SettingsSchema, SettingsResponse

router = APIRouter(prefix="/settings", tags=["User & Privacy Settings"])

@router.get("", response_model=SettingsResponse)
def get_user_settings(db: Session = Depends(get_db)):
    settings_rec = db.query(SettingsModel).filter(SettingsModel.id == "user_settings").first()
    if not settings_rec:
        settings_rec = SettingsModel(
            id="user_settings",
            offline_only=False,
            local_storage_only=False,
            auto_delete_audio=True,
            ai_assistance_level="balanced",
            reading_level="grade5",
            speech_rate=0.9
        )
        db.add(settings_rec)
        db.commit()
        db.refresh(settings_rec)
    return settings_rec

@router.post("", response_model=SettingsResponse)
def update_user_settings(data: SettingsSchema, db: Session = Depends(get_db)):
    settings_rec = db.query(SettingsModel).filter(SettingsModel.id == "user_settings").first()
    if not settings_rec:
        settings_rec = SettingsModel(id="user_settings")
        db.add(settings_rec)

    for k, v in data.model_dump().items():
        setattr(settings_rec, k, v)

    db.commit()
    db.refresh(settings_rec)
    return settings_rec
