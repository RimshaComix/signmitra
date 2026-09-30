from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime
from backend.database import Base

class SettingsModel(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default="user_settings")
    offline_only = Column(Boolean, default=False)
    local_storage_only = Column(Boolean, default=False)
    auto_delete_audio = Column(Boolean, default=True)
    ai_assistance_level = Column(String, default="balanced")
    reading_level = Column(String, default="grade5")
    speech_rate = Column(Float, default=0.9)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
