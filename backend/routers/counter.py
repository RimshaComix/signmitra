import csv
import io
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.interaction import CounterInteractionModel
from backend.services.ambiguity_service import ambiguity_service

router = APIRouter(prefix="/counter", tags=["Counter Communication & Analytics"])

# ============================================================
# ALLOWLISTS & ALIASES FOR COUNTER QR & CONTEXT
# ============================================================

ALLOWED_DOMAINS = {"healthcare", "banking", "education"}

INTENT_ALIASES = {
    # Healthcare aliases
    "request-medical-reports": "medical_reports_request",
    "medical-reports-request": "medical_reports_request",
    "medical_reports_request": "medical_reports_request",
    "communication-accommodation": "communication_assist_request",
    "communication-assist-request": "communication_assist_request",
    "communication_assist_request": "communication_assist_request",
    "appointment-booking": "appointment_booking",
    "appointment_booking": "appointment_booking",
    "follow-up-scheduling": "follow_up_scheduling",
    "follow_up_scheduling": "follow_up_scheduling",
    "lab-test-instructions": "lab_test_instructions",
    "lab_test_instructions": "lab_test_instructions",
    "prescription-refill": "prescription_refill",
    "prescription_refill": "prescription_refill",
    "symptom-explanation": "symptom_explanation",
    "symptom_explanation": "symptom_explanation",
    "billing-insurance-query": "billing_insurance_query",
    "billing_insurance_query": "billing_insurance_query",
    # Banking aliases
    "kyc-update": "kyc_update",
    "kyc_update": "kyc_update",
    "card-block": "card_block",
    "card_block": "card_block",
    "account-statement": "account_statement",
    "account_statement": "account_statement",
    "passbook-print": "passbook_print",
    "passbook_print": "passbook_print",
    "cheque-deposit": "cheque_deposit",
    "cheque_deposit": "cheque_deposit",
    "loan-inquiry": "loan_inquiry",
    "loan_inquiry": "loan_inquiry",
    "dispute-charge": "dispute_charge",
    "dispute_charge": "dispute_charge",
    # Education aliases
    "certificate-request": "certificate_request",
    "certificate_request": "certificate_request",
    "fee-extension": "fee_extension",
    "fee_extension": "fee_extension",
    "attendance-correction": "attendance_correction",
    "attendance_correction": "attendance_correction",
    "exam-accommodation": "exam_accommodation",
    "exam_accommodation": "exam_accommodation",
    "id-replacement": "id_replacement",
    "id_replacement": "id_replacement",
    "scholarship-status": "scholarship_status",
    "scholarship_status": "scholarship_status",
    "timetable-change": "timetable_change",
    "timetable_change": "timetable_change",
}

DOMAIN_INTENTS = {
    "healthcare": {
        "medical_reports_request": "Request Medical Reports",
        "communication_assist_request": "Communication Accommodation",
        "appointment_booking": "Book an Appointment",
        "follow_up_scheduling": "Schedule Follow-Up Visit",
        "lab_test_instructions": "Lab Test & Fasting Instructions",
        "prescription_refill": "Medicine & Prescription Help",
        "symptom_explanation": "Explain Symptoms to Doctor",
        "billing_insurance_query": "Hospital Bill or Insurance Help",
    },
    "banking": {
        "kyc_update": "Update KYC Details",
        "card_block": "Report Damaged or Lost Card",
        "account_statement": "Request Account Statement",
        "passbook_print": "Update Passbook",
        "cheque_deposit": "Cheque Deposit / Clearance Help",
        "loan_inquiry": "Loan or Interest Rate Inquiry",
        "dispute_charge": "Clarify Bank Fee or Failed Deduction",
    },
    "education": {
        "certificate_request": "Request Bonafide / Transcript",
        "fee_extension": "Fee Payment & Receipt Query",
        "attendance_correction": "Attendance or Medical Leave Help",
        "exam_accommodation": "Exam Writer / Extra Time Request",
        "id_replacement": "Student ID Card Replacement",
        "scholarship_status": "Scholarship Status Inquiry",
        "timetable_change": "Class Room or Lab Schedule Query",
    },
}

KNOWN_ORGANIZATIONS = {
    "cityhospital": "City General Hospital",
    "general-clinic": "Community Care Clinic",
    "metro-bank": "Metro National Bank",
    "state-university": "State University Administration",
    "default-org": "SignMitra Partner Counter",
}


def sanitize_code(raw: Optional[str], default: str, max_len: int = 32) -> str:
    if not raw or not str(raw).strip():
        return default
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", str(raw).strip())
    return cleaned[:max_len] if cleaned else default


def resolve_counter_context(
    domain: Optional[str],
    intent: Optional[str],
    counter: Optional[str] = None,
    org: Optional[str] = None,
) -> dict:
    raw_domain = (domain or "").strip().lower()
    raw_intent = (intent or "").strip().lower()

    fallback_used = False
    warnings = []

    if raw_domain in ALLOWED_DOMAINS:
        canonical_domain = raw_domain
    else:
        canonical_domain = "healthcare"
        if raw_domain:
            fallback_used = True
            warnings.append(f"Unrecognized domain '{domain}'; defaulted to healthcare.")

    canonical_intent = INTENT_ALIASES.get(raw_intent, "")
    allowed_for_domain = DOMAIN_INTENTS[canonical_domain]

    if canonical_intent not in allowed_for_domain:
        # Check if the intent belongs to another domain when domain wasn't explicitly set
        matched_other = False
        if not raw_domain and canonical_intent:
            for d_name, d_map in DOMAIN_INTENTS.items():
                if canonical_intent in d_map:
                    canonical_domain = d_name
                    allowed_for_domain = d_map
                    matched_other = True
                    break
        if not matched_other:
            default_intents = {
                "healthcare": "medical_reports_request",
                "banking": "kyc_update",
                "education": "certificate_request",
            }
            if raw_intent:
                fallback_used = True
                warnings.append(
                    f"Unrecognized intent '{intent}' for {canonical_domain}; defaulted to '{default_intents[canonical_domain]}'."
                )
            canonical_intent = default_intents[canonical_domain]

    counter_id = sanitize_code(counter, "Counter-1", max_len=24)
    org_id = sanitize_code(org, "cityhospital" if canonical_domain == "healthcare" else "default-org", max_len=32).lower()
    org_display = KNOWN_ORGANIZATIONS.get(org_id, org_id.replace("-", " ").title())
    intent_title = allowed_for_domain.get(canonical_intent, "Counter Request")

    slug_intent = (
        "request-medical-reports"
        if canonical_intent == "medical_reports_request"
        else canonical_intent.replace("_", "-")
    )
    qr_query = f"/communication?domain={canonical_domain}&intent={slug_intent}&counter={counter_id}&org={org_id}"

    return {
        "valid": not fallback_used,
        "fallback_used": fallback_used,
        "warnings": warnings,
        "domain": canonical_domain,
        "intent": canonical_intent,
        "intent_slug": slug_intent,
        "intent_title": intent_title,
        "counter_id": counter_id,
        "org_id": org_id,
        "org_display_name": org_display,
        "qr_url": qr_query,
    }


def seed_sample_interactions_if_empty(db: Session):
    existing_count = db.query(CounterInteractionModel).count()
    if existing_count > 0:
        return

    now = datetime.utcnow()
    samples = [
        CounterInteractionModel(
            id="sample-int-01",
            org_id="cityhospital",
            counter_id="OPD-3",
            domain="healthcare",
            intent="medical_reports_request",
            intent_title="Request Medical Reports",
            status="completed",
            outcome="resolved",
            reply_type="schedule_collection",
            vague_replies_blocked=1,
            blocked_attempts_log=[{"category": "relative_time", "quote": "tomorrow morning"}],
            confirmed_facts=[
                {"field": "Date", "value": (now + timedelta(days=1)).strftime("%Y-%m-%d"), "source": "Staff-confirmed (Structured)"},
                {"field": "Time", "value": "11:30 AM", "source": "Staff-confirmed (Structured)"},
                {"field": "Counter / Location", "value": "Counter 4", "source": "Staff-confirmed (Structured)"},
            ],
            still_unclear=[],
            staff_response_summary="Scheduled for collection at Counter 4 at 11:30 AM.",
            duration_seconds=44,
            user_understood="yes",
            is_sample_data=True,
            started_at=now - timedelta(hours=5),
            completed_at=now - timedelta(hours=5) + timedelta(seconds=44),
        ),
        CounterInteractionModel(
            id="sample-int-02",
            org_id="cityhospital",
            counter_id="OPD-1",
            domain="healthcare",
            intent="appointment_booking",
            intent_title="Book an Appointment",
            status="completed",
            outcome="resolved",
            reply_type="schedule_collection",
            vague_replies_blocked=0,
            blocked_attempts_log=[],
            confirmed_facts=[
                {"field": "Date", "value": (now + timedelta(days=2)).strftime("%Y-%m-%d"), "source": "Staff-confirmed (Structured)"},
                {"field": "Time", "value": "10:00 AM", "source": "Staff-confirmed (Structured)"},
                {"field": "Counter / Location", "value": "OPD-1 Room 104", "source": "Staff-confirmed (Structured)"},
            ],
            still_unclear=[],
            staff_response_summary="Appointment confirmed at OPD-1 Room 104 at 10:00 AM.",
            duration_seconds=36,
            user_understood="yes",
            is_sample_data=True,
            started_at=now - timedelta(hours=18),
            completed_at=now - timedelta(hours=18) + timedelta(seconds=36),
        ),
        CounterInteractionModel(
            id="sample-int-03",
            org_id="cityhospital",
            counter_id="Billing-2",
            domain="healthcare",
            intent="lab_test_instructions",
            intent_title="Lab Test & Fasting Instructions",
            status="completed",
            outcome="redirected",
            reply_type="redirect",
            vague_replies_blocked=1,
            blocked_attempts_log=[{"category": "vague_location", "quote": "the other counter"}],
            confirmed_facts=[
                {"field": "Redirect Department", "value": "Diagnostic Lab Wing", "source": "Staff-confirmed (Structured)"},
                {"field": "Target Counter / Room", "value": "Counter 6", "source": "Staff-confirmed (Structured)"},
                {"field": "Floor / Location", "value": "Ground Floor, East Block", "source": "Staff-confirmed (Structured)"},
            ],
            still_unclear=[],
            staff_response_summary="Redirected to Diagnostic Lab Wing, Counter 6, Ground Floor, East Block.",
            duration_seconds=52,
            user_understood="yes",
            is_sample_data=True,
            started_at=now - timedelta(days=1, hours=2),
            completed_at=now - timedelta(days=1, hours=2) + timedelta(seconds=52),
        ),
        CounterInteractionModel(
            id="sample-int-04",
            org_id="metro-bank",
            counter_id="Desk-2",
            domain="banking",
            intent="kyc_update",
            intent_title="Update KYC Details",
            status="completed",
            outcome="resolved",
            reply_type="required_documents",
            vague_replies_blocked=1,
            blocked_attempts_log=[{"category": "document_unspecified", "quote": "required documents"}],
            confirmed_facts=[
                {"field": "Required Documents", "value": "Aadhaar card, PAN card", "source": "Staff-confirmed (Structured)"},
                {"field": "Submission Counter", "value": "Counter 2", "source": "Staff-confirmed (Structured)"},
            ],
            still_unclear=[],
            staff_response_summary="Bring Aadhaar card, PAN card and submit at Counter 2.",
            duration_seconds=49,
            user_understood="partially",
            is_sample_data=True,
            started_at=now - timedelta(days=1, hours=6),
            completed_at=now - timedelta(days=1, hours=6) + timedelta(seconds=49),
        ),
    ]
    for s in samples:
        db.add(s)
    db.commit()


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/config")
def get_counter_config(
    domain: Optional[str] = Query(default="healthcare"),
    intent: Optional[str] = Query(default="request-medical-reports"),
    counter: Optional[str] = Query(default=None),
    org: Optional[str] = Query(default=None),
):
    return resolve_counter_context(domain=domain, intent=intent, counter=counter, org=org)


@router.post("/validate-reply")
def validate_staff_reply_endpoint(payload: dict, db: Session = Depends(get_db)):
    result = ambiguity_service.validate_staff_reply(payload)

    interaction_id = payload.get("interaction_id")
    if interaction_id and not result["valid"]:
        rec = db.query(CounterInteractionModel).filter(CounterInteractionModel.id == interaction_id).first()
        if rec:
            rec.vague_replies_blocked = (rec.vague_replies_blocked or 0) + 1
            logs = list(rec.blocked_attempts_log or [])
            logs.append({
                "timestamp": datetime.utcnow().isoformat(),
                "reply_type": payload.get("reply_type"),
                "missing_fields": result.get("missing_fields", []),
            })
            rec.blocked_attempts_log = logs
            db.commit()

    return result


@router.post("/interactions")
def upsert_counter_interaction(payload: dict, db: Session = Depends(get_db)):
    interaction_id = payload.get("id") or f"int-{uuid.uuid4().hex[:10]}"
    ctx = resolve_counter_context(
        domain=payload.get("domain"),
        intent=payload.get("intent"),
        counter=payload.get("counter_id") or payload.get("counter"),
        org=payload.get("org_id") or payload.get("org"),
    )

    rec = db.query(CounterInteractionModel).filter(CounterInteractionModel.id == interaction_id).first()
    now = datetime.utcnow()

    if not rec:
        rec = CounterInteractionModel(
            id=interaction_id,
            org_id=ctx["org_id"],
            counter_id=ctx["counter_id"],
            domain=ctx["domain"],
            intent=ctx["intent"],
            intent_title=payload.get("intent_title") or ctx["intent_title"],
            status=payload.get("status", "started"),
            outcome=payload.get("outcome", "in_progress"),
            reply_type=payload.get("reply_type"),
            vague_replies_blocked=int(payload.get("vague_replies_blocked", 0) or 0),
            blocked_attempts_log=payload.get("blocked_attempts_log", []),
            confirmed_facts=payload.get("confirmed_facts", []),
            still_unclear=payload.get("still_unclear", []),
            staff_response_summary=payload.get("staff_response_summary"),
            duration_seconds=payload.get("duration_seconds"),
            user_understood=payload.get("user_understood"),
            is_sample_data=bool(payload.get("is_sample_data", False)),
            started_at=now,
            completed_at=now if payload.get("status") == "completed" else None,
        )
        db.add(rec)
    else:
        if "status" in payload and payload["status"]:
            rec.status = payload["status"]
            if payload["status"] == "completed" and not rec.completed_at:
                rec.completed_at = now
        if "outcome" in payload and payload["outcome"]:
            rec.outcome = payload["outcome"]
        if "reply_type" in payload and payload["reply_type"]:
            rec.reply_type = payload["reply_type"]
        if "vague_replies_blocked" in payload and payload["vague_replies_blocked"] is not None:
            rec.vague_replies_blocked = max(
                int(rec.vague_replies_blocked or 0),
                int(payload["vague_replies_blocked"]),
            )
        if "confirmed_facts" in payload and payload["confirmed_facts"] is not None:
            rec.confirmed_facts = payload["confirmed_facts"]
        if "still_unclear" in payload and payload["still_unclear"] is not None:
            rec.still_unclear = payload["still_unclear"]
        if "staff_response_summary" in payload and payload["staff_response_summary"] is not None:
            rec.staff_response_summary = payload["staff_response_summary"]
        if "duration_seconds" in payload and payload["duration_seconds"] is not None:
            rec.duration_seconds = int(payload["duration_seconds"])
        elif rec.status == "completed" and rec.duration_seconds is None and rec.started_at:
            rec.duration_seconds = max(1, int((now - rec.started_at).total_seconds()))
        if "user_understood" in payload and payload["user_understood"]:
            rec.user_understood = payload["user_understood"]

    db.commit()
    db.refresh(rec)

    return {
        "id": rec.id,
        "org_id": rec.org_id,
        "counter_id": rec.counter_id,
        "domain": rec.domain,
        "intent": rec.intent,
        "intent_title": rec.intent_title,
        "status": rec.status,
        "outcome": rec.outcome,
        "reply_type": rec.reply_type,
        "vague_replies_blocked": rec.vague_replies_blocked,
        "confirmed_facts": rec.confirmed_facts or [],
        "still_unclear": rec.still_unclear or [],
        "staff_response_summary": rec.staff_response_summary,
        "duration_seconds": rec.duration_seconds,
        "user_understood": rec.user_understood,
        "is_sample_data": rec.is_sample_data,
        "started_at": rec.started_at.isoformat() if rec.started_at else None,
        "completed_at": rec.completed_at.isoformat() if rec.completed_at else None,
    }


@router.get("/analytics")
def get_institution_analytics(
    org_id: Optional[str] = Query(default=None),
    domain: Optional[str] = Query(default=None),
    include_sample: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    seed_sample_interactions_if_empty(db)

    query = db.query(CounterInteractionModel)
    if not include_sample:
        query = query.filter(CounterInteractionModel.is_sample_data == False)  # noqa: E712
    if org_id and org_id.lower() != "all":
        query = query.filter(CounterInteractionModel.org_id == org_id.lower())
    if domain and domain.lower() != "all":
        query = query.filter(CounterInteractionModel.domain == domain.lower())

    rows = query.order_by(CounterInteractionModel.started_at.desc()).all()

    total_interactions = len(rows)
    completed_rows = [r for r in rows if r.status == "completed"]
    completed_count = len(completed_rows)
    live_count = sum(1 for r in rows if not r.is_sample_data)
    sample_count = sum(1 for r in rows if r.is_sample_data)

    durations = [r.duration_seconds for r in completed_rows if r.duration_seconds is not None and r.duration_seconds > 0]
    avg_completion_seconds = round(sum(durations) / len(durations), 1) if durations else 0.0

    total_vague_blocked = sum(int(r.vague_replies_blocked or 0) for r in rows)

    outcome_dist = {"resolved": 0, "redirected": 0, "unresolved": 0, "in_progress": 0}
    counter_counts = {}
    daily_counts = {}
    intent_counts = {}
    understood_counts = {"yes": 0, "partially": 0, "no": 0}

    for r in rows:
        out_key = r.outcome if r.outcome in outcome_dist else "in_progress"
        outcome_dist[out_key] += 1

        c_key = f"{r.org_id}:{r.counter_id}"
        counter_counts[c_key] = counter_counts.get(c_key, 0) + 1

        day_str = (r.started_at or datetime.utcnow()).strftime("%Y-%m-%d")
        daily_counts[day_str] = daily_counts.get(day_str, 0) + 1

        i_label = r.intent_title or r.intent
        intent_counts[i_label] = intent_counts.get(i_label, 0) + 1

        if r.user_understood in understood_counts:
            understood_counts[r.user_understood] += 1

    total_feedback = sum(understood_counts.values())
    understood_rate_pct = (
        round((understood_counts["yes"] / total_feedback) * 100, 1)
        if total_feedback > 0
        else None
    )

    return {
        "total_interactions": total_interactions,
        "completed_interactions": completed_count,
        "live_recorded_count": live_count,
        "sample_seed_count": sample_count,
        "average_completion_seconds": avg_completion_seconds,
        "total_vague_replies_blocked": total_vague_blocked,
        "outcome_distribution": outcome_dist,
        "interactions_by_counter": [
            {"counter": k, "count": v}
            for k, v in sorted(counter_counts.items(), key=lambda x: -x[1])
        ],
        "interactions_by_day": [
            {"date": k, "count": v}
            for k, v in sorted(daily_counts.items(), key=lambda x: x[0])
        ],
        "most_common_intents": [
            {"intent": k, "count": v}
            for k, v in sorted(intent_counts.items(), key=lambda x: -x[1])
        ],
        "user_understood": {
            "counts": understood_counts,
            "total_responses": total_feedback,
            "understood_rate_pct": understood_rate_pct,
        },
        "recent_interactions": [
            {
                "id": r.id,
                "org_id": r.org_id,
                "counter_id": r.counter_id,
                "domain": r.domain,
                "intent": r.intent,
                "intent_title": r.intent_title,
                "status": r.status,
                "outcome": r.outcome,
                "reply_type": r.reply_type,
                "vague_replies_blocked": r.vague_replies_blocked,
                "duration_seconds": r.duration_seconds,
                "user_understood": r.user_understood,
                "is_sample_data": r.is_sample_data,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in rows[:50]
        ],
    }


@router.get("/analytics/export.csv")
def export_institution_analytics_csv(
    org_id: Optional[str] = Query(default=None),
    domain: Optional[str] = Query(default=None),
    include_sample: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    data = get_institution_analytics(
        org_id=org_id,
        domain=domain,
        include_sample=include_sample,
        db=db,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Data_Source",
        "Interaction_ID",
        "Organization_ID",
        "Counter_ID",
        "Domain",
        "Intent",
        "Status",
        "Outcome",
        "Reply_Type",
        "Vague_Replies_Blocked",
        "Duration_Seconds",
        "User_Understood",
        "Started_At",
        "Completed_At",
    ])
    for r in data["recent_interactions"]:
        writer.writerow([
            "SAMPLE_SEED" if r["is_sample_data"] else "LIVE_RECORDED",
            r["id"],
            r["org_id"],
            r["counter_id"],
            r["domain"],
            r["intent_title"] or r["intent"],
            r["status"],
            r["outcome"],
            r["reply_type"] or "",
            r["vague_replies_blocked"],
            r["duration_seconds"] if r["duration_seconds"] is not None else "",
            r["user_understood"] or "",
            r["started_at"] or "",
            r["completed_at"] or "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=SignMitra_Institution_Analytics.csv"
        },
    )


@router.delete("/interactions")
def clear_counter_interactions(
    only_sample: bool = Query(default=False),
    org_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(CounterInteractionModel)
    if only_sample:
        q = q.filter(CounterInteractionModel.is_sample_data == True)  # noqa: E712
    if org_id and org_id.lower() != "all":
        q = q.filter(CounterInteractionModel.org_id == org_id.lower())
    deleted = q.delete(synchronize_session=False)
    db.commit()
    return {"deleted": deleted}
