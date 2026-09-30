from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from backend.schemas.recovery import (
    RecoveryPrepareRequest,
    RecoveryPrepareResponse,
    ChecklistItem,
    CardItem,
    ExtractDetailsRequest,
    ExtractDetailsResponse,
    RecoverySummaryRequest,
    RecoverySummaryResponse,
    AmbiguityItem,
    FactItem
)
from backend.services.ai_service import gemini_service
from backend.services.ambiguity_service import ambiguity_service

router = APIRouter(prefix="/recovery", tags=["Recovery Journey"])

@router.post("/prepare", response_model=RecoveryPrepareResponse)
async def prepare_interaction(req: RecoveryPrepareRequest):
    """
    Step 1 & 2: Generates a preparation plan, checklist, and initial cards.
    """
    if gemini_service.is_configured():
        prompt = (
            f"You are SignMitra's Visit Copilot for Deaf and Hard of Hearing individuals in India.\n"
            f"Context / Domain: {req.context}\n"
            f"Interaction Goal: {req.goal}\n"
            f"Communication Preferences: {req.preferences}\n"
            f"Institution: {req.institution or 'Standard public institution'}\n\n"
            f"Generate a preparation checklist, tailored counter communication cards, and required documents list.\n"
            f"Return JSON format:\n"
            f'{{\n'
            f'  "checklist": [\n'
            f'    {{"id": "chk-1", "text": "Carry original ID card and 2 photocopies", "category": "documents"}}\n'
            f'  ],\n'
            f'  "cards": [\n'
            f'    {{"id": "c-1", "title": "Opening Statement", "text": "Hello, I am Deaf. I am here to...", "type": "opening"}}\n'
            f'  ],\n'
            f'  "required_documents": ["Aadhaar card", "Application form"]\n'
            f'}}'
        )
        try:
            ai_data = await gemini_service.generate_structured_json(prompt)
            return RecoveryPrepareResponse(
                domain=req.context,
                goal=req.goal,
                checklist=[ChecklistItem(**item) for item in ai_data.get("checklist", [])],
                cards=[CardItem(**item) for item in ai_data.get("cards", [])],
                required_documents=ai_data.get("required_documents", []),
                engine="gemini_llm",
                provenance="AI-suggested (Requires user review)"
            )
        except Exception as e:
            # Fall through to deterministic if error occurs
            pass

    # Deterministic preparation generator
    cards = [
        CardItem(
            id="card-opening",
            title="Initial Purpose Card",
            text=f"Hello, I am here regarding: {req.goal}. Please communicate in writing.",
            type="opening"
        ),
        CardItem(
            id="card-clarify",
            title="Clarification Request",
            text="Could you please write down the exact room or counter number I should visit?",
            type="clarification"
        ),
        CardItem(
            id="card-closing",
            title="Acknowledgement Request",
            text="Thank you. Could you please provide a stamped acknowledgement or receipt?",
            type="closing"
        )
    ]

    checklist = [
        ChecklistItem(id="chk-1", text=f"Identify destination counter for {req.context}", category="location"),
        ChecklistItem(id="chk-2", text="Carry valid government ID (Aadhaar/Student ID/PAN)", category="documents"),
        ChecklistItem(id="chk-3", text="Carry printed application forms and 2 photocopies", category="documents"),
        ChecklistItem(id="chk-4", text="Request written instructions from the counter officer", category="communication"),
    ]

    docs = ["Valid Identity Card", "Application Form", "Relevant Fee Receipt / Previous Token"]

    return RecoveryPrepareResponse(
        domain=req.context,
        goal=req.goal,
        checklist=checklist,
        cards=cards,
        required_documents=docs,
        engine="deterministic_copilot",
        provenance="AI-suggested (Requires user review)"
    )

@router.post("/extract", response_model=ExtractDetailsResponse)
async def extract_details(req: ExtractDetailsRequest):
    """
    Step 4, 5, 6, 7: Analyzes staff replies, extracts structured details,
    detects relative dates ('tomorrow morning') and ambiguous instructions,
    and returns targeted clarification questions.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Staff reply text cannot be empty.")

    # 1. First run the deterministic linguistic analyzer (guarantees relative dates like 'tomorrow morning' are caught!)
    facts, gaps, relative_dates, clarifications = ambiguity_service.analyze_text(req.text)

    # 2. If Gemini is available, enhance the plain-language summary and action step
    summary = req.text.strip()
    action_step = "Confirm next step and required documents with staff."
    engine = "ambiguity_engine"

    if gemini_service.is_configured():
        prompt = (
            f"You are SignMitra's institutional communication assistant for Deaf individuals.\n"
            f"Context: {req.context}\n"
            f"Staff reply text: \"{req.text}\"\n\n"
            f"Task:\n"
            f"1. Provide a 1-sentence plain-language summary.\n"
            f"2. Provide a single concrete next action step.\n"
            f"3. Note: Do NOT invent dates, deadlines, or locations not present in the staff text.\n"
            f"Return JSON format:\n"
            f'{{"summary": "...", "action_step": "..."}}'
        )
        try:
            res = await gemini_service.generate_structured_json(prompt)
            summary = res.get("summary", summary)
            action_step = res.get("action_step", action_step)
            engine = "gemini_llm + ambiguity_engine"
        except Exception:
            pass

    return ExtractDetailsResponse(
        original_text=req.text,
        summary=summary,
        action_step=action_step,
        facts=facts,
        gaps=gaps,
        relative_dates_detected=relative_dates,
        clarifications=clarifications,
        engine=engine
    )

@router.post("/summarize", response_model=RecoverySummaryResponse)
async def summarize_recovery(req: RecoverySummaryRequest):
    """
    Step 9 & 10: Produces a structured summary strictly distinguishing
    User-Confirmed facts from Unresolved Questions / Ambiguities.
    """
    confirmed_labels = [f.get("value", "") or f.get("field", "") for f in req.confirmed_facts if f.get("value")]
    unresolved_labels = [q.get("issue", "") or q.get("quote", "") for q in req.unresolved_questions if q.get("issue")]

    summary_text = (
        f"Interaction at {req.context} for goal: '{req.goal}'. "
        f"Verified Details: {', '.join(confirmed_labels) if confirmed_labels else 'None confirmed yet'}. "
        f"Open Questions: {', '.join(unresolved_labels) if unresolved_labels else 'All critical details clarified'}."
    )

    suggested_tasks = []
    for f in req.confirmed_facts:
        if "action" in f.get("field", "").lower():
            suggested_tasks.append({
                "title": f"{req.context}: {f.get('value')}",
                "priority": "high",
                "status": "pending"
            })
    for q in req.unresolved_questions:
        suggested_tasks.append({
            "title": f"Clarify with {req.context}: {q.get('quote') or q.get('issue')}",
            "priority": "medium",
            "status": "pending"
        })

    if not suggested_tasks:
        suggested_tasks.append({
            "title": f"{req.context}: Follow up on {req.goal}",
            "priority": "medium",
            "status": "pending"
        })

    return RecoverySummaryResponse(
        summary=summary_text,
        confirmed_facts=req.confirmed_facts,
        unresolved_questions=req.unresolved_questions,
        suggested_tasks=suggested_tasks,
        engine="structured_provenance_summarizer"
    )
