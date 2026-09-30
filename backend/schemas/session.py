from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SessionCreate(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1)
    domain: str = "General"
    intent: str = "Assistance"
    status: str = "active"
    transcript: Optional[List[Any]] = []
    confirmed_facts: Optional[List[Any]] = []
    unresolved_questions: Optional[List[Any]] = []
    followup_actions: Optional[List[Any]] = []
    extra_metadata: Optional[Dict[str, Any]] = None

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    domain: Optional[str] = None
    intent: Optional[str] = None
    status: Optional[str] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    confirmed_facts: Optional[List[Dict[str, Any]]] = None
    unresolved_questions: Optional[List[Dict[str, Any]]] = None
    followup_actions: Optional[List[Dict[str, Any]]] = None
    extra_metadata: Optional[Dict[str, Any]] = None

class SessionResponse(BaseModel):
    id: str
    title: str
    domain: str
    intent: str
    status: str
    transcript: Optional[List[Dict[str, Any]]] = []
    confirmed_facts: Optional[List[Dict[str, Any]]] = []
    unresolved_questions: Optional[List[Dict[str, Any]]] = []
    followup_actions: Optional[List[Dict[str, Any]]] = []
    extra_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
