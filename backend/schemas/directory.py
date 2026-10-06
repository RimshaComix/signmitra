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


# =====================================================================
# Places Search & Universal Directory Schemas
# =====================================================================
from typing import List, Dict, Any

class PlaceSearchResultItem(BaseModel):
    place_id: str
    name: str
    formatted_address: str
    category: str = "Other"
    provider: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raw_types: Optional[List[str]] = None
    known_accessibility: Optional[Dict[str, Any]] = None


class PlaceSearchResponse(BaseModel):
    success: bool
    provider: str
    configured: bool
    query: str
    results_count: int
    results: List[PlaceSearchResultItem]
    error: Optional[str] = None
    message: Optional[str] = None
    setup_guide: Optional[Dict[str, Any]] = None


# =====================================================================
# Visit Plan Schemas
# =====================================================================
class VisitPlanCreate(BaseModel):
    id: Optional[str] = None
    place_name: str = Field(..., min_length=1)
    address: Optional[str] = ""
    category: str = "Other"
    visit_purpose: Optional[str] = ""
    planned_date: Optional[str] = ""
    communication_preferences: List[str] = Field(default_factory=list)
    custom_notes: Optional[str] = ""
    questions_to_confirm: List[str] = Field(default_factory=list)
    communication_card: Optional[Dict[str, Any]] = None
    checklist: List[Dict[str, Any]] = Field(default_factory=list)
    visit_notes: Optional[Dict[str, Any]] = None


class VisitPlanResponse(BaseModel):
    id: str
    place_name: str
    address: str = ""
    category: str = "Other"
    visit_purpose: str = ""
    planned_date: str = ""
    communication_preferences: List[str] = Field(default_factory=list)
    custom_notes: str = ""
    questions_to_confirm: List[str] = Field(default_factory=list)
    communication_card: Optional[Dict[str, Any]] = None
    checklist: List[Dict[str, Any]] = Field(default_factory=list)
    visit_notes: Optional[Dict[str, Any]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Accessibility Feedback Schemas
# =====================================================================
class AccessibilityFeedbackCreate(BaseModel):
    place_name: str = Field(..., min_length=1)
    address: Optional[str] = ""
    department_visited: Optional[str] = ""
    date_observed: Optional[str] = ""
    support_observed: List[str] = Field(default_factory=list)
    notes: Optional[str] = ""
    verification_level: str = "user_reported" # directly_confirmed, personally_observed, uncertain


class AccessibilityFeedbackResponse(BaseModel):
    id: str
    place_name: str
    verification_level: str
    status: str = "user_reported"
    message: str = "Accessibility observation recorded locally. Status: User-reported (Pending independent audit)."
    created_at: datetime
