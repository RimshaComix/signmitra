from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON
from backend.database import Base


class CounterInteractionModel(Base):
    """
    Stores operational counter communication telemetry and structured
    confirmations without storing sensitive clinical or financial PII.
    """
    __tablename__ = "counter_interactions"

    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, nullable=False, default="default-org", index=True)
    counter_id = Column(String, nullable=False, default="General-Counter", index=True)
    domain = Column(String, nullable=False, default="healthcare", index=True)
    intent = Column(String, nullable=False, default="medical_reports_request", index=True)
    intent_title = Column(String, nullable=True, default="Request Medical Reports")

    status = Column(String, nullable=False, default="started")  # started | completed | abandoned
    outcome = Column(String, nullable=False, default="in_progress")  # resolved | redirected | unresolved | in_progress
    reply_type = Column(String, nullable=True)

    vague_replies_blocked = Column(Integer, nullable=False, default=0)
    blocked_attempts_log = Column(JSON, nullable=True, default=list)

    confirmed_facts = Column(JSON, nullable=True, default=list)
    still_unclear = Column(JSON, nullable=True, default=list)
    staff_response_summary = Column(String, nullable=True)

    duration_seconds = Column(Integer, nullable=True)
    user_understood = Column(String, nullable=True)  # yes | partially | no
    is_sample_data = Column(Boolean, nullable=False, default=False)

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
