import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.session import SessionModel
from backend.models.followup import FollowupModel
from backend.schemas.session import SessionCreate, SessionUpdate, SessionResponse

router = APIRouter(prefix="/sessions", tags=["Saved Sessions & Planner"])

@router.get("", response_model=List[SessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    """
    Retrieves all persistent AI Studio user sessions.
    """
    return db.query(SessionModel).order_by(SessionModel.updated_at.desc()).all()

@router.post("", response_model=SessionResponse, status_code=201)
def create_session(data: SessionCreate, db: Session = Depends(get_db)):
    """
    Persists a completed or in-progress session to the database.
    """
    session_id = data.id or f"session-{str(uuid.uuid4())[:8]}"
    existing = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if existing:
        # Update existing
        for k, v in data.model_dump(exclude_unset=True).items():
            if k != "id":
                setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    new_session = SessionModel(
        id=session_id,
        title=data.title,
        domain=data.domain,
        intent=data.intent,
        status=data.status,
        transcript=data.transcript,
        confirmed_facts=data.confirmed_facts,
        unresolved_questions=data.unresolved_questions,
        followup_actions=data.followup_actions,
        extra_metadata=data.extra_metadata
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    rec = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Session not found.")
    return rec

@router.put("/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, data: SessionUpdate, db: Session = Depends(get_db)):
    rec = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Session not found.")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    rec = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Session not found.")
    db.delete(rec)
    db.commit()
    return None

# Followups & Planner endpoints
@router.get("/planner/tasks")
def list_planner_tasks(db: Session = Depends(get_db)):
    return db.query(FollowupModel).order_by(FollowupModel.created_at.desc()).all()

@router.post("/planner/tasks", status_code=201)
def create_planner_task(task_data: dict, db: Session = Depends(get_db)):
    task_id = task_data.get("id") or f"task-{str(uuid.uuid4())[:8]}"
    existing = db.query(FollowupModel).filter(FollowupModel.id == task_id).first()
    if existing:
        existing.title = task_data.get("title", existing.title)
        existing.situation = task_data.get("situation", existing.situation)
        existing.category = task_data.get("category", existing.category)
        existing.type = task_data.get("type", existing.type)
        existing.next_action = task_data.get("nextAction", task_data.get("next_action", existing.next_action))
        existing.due_date = task_data.get("dueDate", task_data.get("due_date", existing.due_date))
        existing.priority = task_data.get("priority", existing.priority)
        existing.status = task_data.get("status", existing.status)
        db.commit()
        db.refresh(existing)
        return existing

    model = FollowupModel(
        id=task_id,
        title=task_data.get("title", "Follow-up Task"),
        situation=task_data.get("situation", ""),
        category=task_data.get("category", "general"),
        type=task_data.get("type", "task"),
        next_action=task_data.get("nextAction", task_data.get("next_action", "")),
        due_date=task_data.get("dueDate", task_data.get("due_date", "")),
        priority=task_data.get("priority", "medium"),
        status=task_data.get("status", "pending")
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model
