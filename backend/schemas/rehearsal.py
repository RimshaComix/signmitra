from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RehearsalScenarioRequest(BaseModel):
    domain: str = Field(..., description="Interaction context, e.g., Bank Counter, Hospital OPD, Railway Ticket Counter")
    persona_type: str = Field("standard", description="standard, fast_paced, impatient, helpful")

class RehearsalScenarioResponse(BaseModel):
    scenario_id: str
    domain: str
    persona_name: str
    scenario_brief: str
    initial_dialogue: str
    learning_objectives: List[str]
    engine: str

class RubricItem(BaseModel):
    criterion: str
    score: int = Field(..., ge=0, le=100)
    observation: str

class RehearsalEvaluateRequest(BaseModel):
    scenario_id: str
    domain: str
    history: List[Dict[str, str]]
    user_reply: str

class RehearsalEvaluateResponse(BaseModel):
    scenario_id: str
    staff_response: str
    actionable_feedback: str
    rubric_scores: List[RubricItem]
    overall_readiness_score: int
    session_completed: bool
    engine: str
