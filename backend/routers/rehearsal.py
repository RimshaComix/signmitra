from fastapi import APIRouter, HTTPException
from backend.schemas.rehearsal import (
    RehearsalScenarioRequest,
    RehearsalScenarioResponse,
    RehearsalEvaluateRequest,
    RehearsalEvaluateResponse
)
from backend.services.rehearsal_service import rehearsal_service

router = APIRouter(prefix="/rehearsal", tags=["Practice Rehearsal"])

@router.post("/scenario", response_model=RehearsalScenarioResponse)
def get_scenario(req: RehearsalScenarioRequest):
    """
    Generates a realistic practice scenario with a chosen staff persona.
    """
    if not req.domain.strip():
        raise HTTPException(status_code=400, detail="Domain cannot be empty.")
    data = rehearsal_service.generate_scenario(req.domain, req.persona_type)
    return RehearsalScenarioResponse(**data)

@router.post("/evaluate", response_model=RehearsalEvaluateResponse)
async def evaluate_turn(req: RehearsalEvaluateRequest):
    """
    Evaluates the user's communication card/message against an objective 3-criteria rubric.
    """
    if not req.user_reply.strip():
        raise HTTPException(status_code=400, detail="User reply cannot be empty.")
    try:
        data = await rehearsal_service.evaluate_turn(
            scenario_id=req.scenario_id,
            domain=req.domain,
            history=req.history,
            user_reply=req.user_reply
        )
        return RehearsalEvaluateResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rehearsal evaluation error: {str(e)}")
