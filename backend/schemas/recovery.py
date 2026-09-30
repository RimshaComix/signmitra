from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChecklistItem(BaseModel):
    id: str
    text: str
    category: str = "general"
    completed: bool = False

class CardItem(BaseModel):
    id: str
    title: str
    text: str
    type: str = "opening"

class RecoveryPrepareRequest(BaseModel):
    context: str = Field(..., description="Interaction context or domain, e.g., College Office, Bank")
    goal: str = Field(..., description="Goal of the user interaction")
    preferences: Optional[str] = "Writing + Large Text"
    institution: Optional[str] = None

class RecoveryPrepareResponse(BaseModel):
    domain: str
    goal: str
    checklist: List[ChecklistItem]
    cards: List[CardItem]
    required_documents: List[str]
    engine: str
    provenance: str = "AI-suggested (Requires user review)"

class AmbiguityItem(BaseModel):
    category: str
    quote: str
    issue: str
    suggested_action: str

class FactItem(BaseModel):
    field: str
    value: str
    provenance: str = "AI-extracted" # AI-extracted, User-entered, Externally verified
    status: str = "Unresolved" # Unresolved, User-confirmed, User-rejected

class ExtractDetailsRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Staff response or notice text")
    context: Optional[str] = "General"

class ExtractDetailsResponse(BaseModel):
    original_text: str
    summary: str
    action_step: str
    facts: List[FactItem]
    gaps: List[AmbiguityItem]
    relative_dates_detected: List[str]
    clarifications: List[str]
    engine: str

class RecoverySummaryRequest(BaseModel):
    context: str
    goal: str
    confirmed_facts: List[Dict[str, Any]] = []
    unresolved_questions: List[Dict[str, Any]] = []
    staff_reply: Optional[str] = None

class RecoverySummaryResponse(BaseModel):
    summary: str
    confirmed_facts: List[Dict[str, Any]]
    unresolved_questions: List[Dict[str, Any]]
    suggested_tasks: List[Dict[str, Any]]
    engine: str
