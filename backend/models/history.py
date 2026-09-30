from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from backend.database import Base

class HistoryModel(Base):
    __tablename__ = "history"

    id = Column(String, primary_key=True, index=True)
    domain = Column(String, nullable=False)
    intent = Column(String, nullable=False)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    status = Column(String, nullable=False, default="completed")
    verified_by_staff = Column(Boolean, default=False)
    entities = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
