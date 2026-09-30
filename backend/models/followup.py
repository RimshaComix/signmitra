from datetime import datetime
from sqlalchemy import Column, String, DateTime
from backend.database import Base

class FollowupModel(Base):
    __tablename__ = "followups"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    situation = Column(String, nullable=False, default="")
    category = Column(String, nullable=False, default="general")
    type = Column(String, nullable=False, default="task")
    next_action = Column(String, nullable=False, default="")
    due_date = Column(String, nullable=False, default="")
    priority = Column(String, nullable=False, default="medium")
    status = Column(String, nullable=False, default="pending")
    
    created_at = Column(DateTime, default=datetime.utcnow)
