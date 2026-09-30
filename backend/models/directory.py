from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from backend.database import Base

class DirectoryModel(Base):
    __tablename__ = "directory"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False, default="")
    wheelchair_accessible = Column(Boolean, default=True)
    sign_assistance_desk = Column(Boolean, default=False)
    token_display_system = Column(Boolean, default=False)
    written_communication_desk = Column(Boolean, default=True)
    notes = Column(String, default="")
    verified_status = Column(String, nullable=False, default="unverified") # verified, unverified, pending_review
    verified_by = Column(String, nullable=True)
    contact_phone = Column(String, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
