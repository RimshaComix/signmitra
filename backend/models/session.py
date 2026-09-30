from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON
from backend.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    domain = Column(String, nullable=False, default="General")
    intent = Column(String, nullable=False, default="Assistance")
    status = Column(String, nullable=False, default="active")
    
    # Structured recovery details
    transcript = Column(JSON, nullable=True) # list of message objects
    confirmed_facts = Column(JSON, nullable=True) # list of confirmed facts with provenance
    unresolved_questions = Column(JSON, nullable=True) # list of open gaps
    followup_actions = Column(JSON, nullable=True) # list of tasks
    extra_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
