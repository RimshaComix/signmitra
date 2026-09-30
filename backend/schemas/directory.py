from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DirectoryItemBase(BaseModel):
    name: str = Field(..., min_length=2)
    domain: str = Field(..., description="hospital, bank, education, transit, general")
    city: str = Field(..., min_length=2)
    address: str = ""
    wheelchair_accessible: bool = True
    sign_assistance_desk: bool = False
    token_display_system: bool = False
    written_communication_desk: bool = True
    notes: str = ""
    verified_status: str = Field("unverified", description="verified, unverified, pending_review")
    verified_by: Optional[str] = None
    contact_phone: str = ""

class DirectoryItemCreate(DirectoryItemBase):
    pass

class DirectoryItemUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    wheelchair_accessible: Optional[bool] = None
    sign_assistance_desk: Optional[bool] = None
    token_display_system: Optional[bool] = None
    written_communication_desk: Optional[bool] = None
    notes: Optional[str] = None
    verified_status: Optional[str] = None
    verified_by: Optional[str] = None
    contact_phone: Optional[str] = None

from pydantic import BaseModel, Field, ConfigDict

class DirectoryItemResponse(DirectoryItemBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
