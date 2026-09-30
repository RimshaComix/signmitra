from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SettingsSchema(BaseModel):
    offline_only: bool = False
    local_storage_only: bool = False
    auto_delete_audio: bool = True
    ai_assistance_level: str = "balanced"
    reading_level: str = "grade5"
    speech_rate: float = 0.9

class SettingsResponse(SettingsSchema):
    id: str
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
