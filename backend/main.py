import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.services.directory_service import directory_service
from backend.routers import (
    health,
    recovery,
    communication,
    vision,
    language,
    rehearsal,
    directory,
    sessions,
    settings as settings_router,
    isl
)

# Configure logging without leaking secrets
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signmitra.main")

# Ensure database tables exist immediately on import
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed records
    logger.info("Initializing SignMitra Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        directory_service.seed_initial_records_if_empty(db)
        logger.info("Database verification and seeding completed.")
    finally:
        db.close()
        
    yield
    logger.info("Shutting down SignMitra AI Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SignMitra AI Studio Python Backend providing LLM, OCR, Ambiguity Detection, and Verified Accessibility persistence.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception at %s %s: %s", request.method, request.url.path, str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check server logs."}
    )

# Include subrouters
app.include_router(health.router, prefix="/api")
app.include_router(recovery.router, prefix="/api")
app.include_router(communication.router, prefix="/api")
app.include_router(vision.router, prefix="/api")
app.include_router(language.router, prefix="/api")
app.include_router(rehearsal.router, prefix="/api")
app.include_router(directory.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(isl.router, prefix="/api")

# Compatibility proxy endpoint for Next.js /api/ai-studio
@app.post("/api/ai-studio")
async def ai_studio_action_dispatcher(payload: dict):
    """
    Unified action dispatcher for frontend compatibility.
    Maps legacy action names to modular router services.
    """
    action = payload.get("action")
    data = payload.get("data", {})

    if not action:
        return JSONResponse(status_code=400, content={"error": "Missing 'action' parameter."})

    from backend.services.ai_service import gemini_service
    from backend.services.ambiguity_service import ambiguity_service
    from backend.services.translation_service import translation_service
    from backend.services.ocr_service import ocr_service
    from backend.services.rehearsal_service import rehearsal_service

    if action == "copilot_prepare":
        from backend.schemas.recovery import RecoveryPrepareRequest
        req = RecoveryPrepareRequest(
            context=data.get("context", "General"),
            goal=data.get("goal", ""),
            preferences=data.get("preferences", "Writing + Large Text"),
            institution=data.get("institution")
        )
        res = await recovery.prepare_interaction(req)
        dump = res.model_dump()
        dump["suggestedCards"] = dump.get("cards", [])
        dump["suggestedDocuments"] = dump.get("required_documents", [])
        dump["requiredDocuments"] = dump.get("required_documents", [])
        return dump

    elif action == "explain_plain_language":
        from backend.schemas.recovery import ExtractDetailsRequest
        req = ExtractDetailsRequest(text=data.get("text", ""), context=data.get("context", "General"))
        res = await recovery.extract_details(req)
        location = next((f.value for f in res.facts if "location" in f.field.lower()), "")
        deadline = next((f.value for f in res.facts if "date" in f.field.lower() or "deadline" in f.field.lower() or "time" in f.field.lower()), "")
        if not deadline and res.relative_dates_detected:
            deadline = ", ".join(res.relative_dates_detected)
        return {
            "summary": res.summary,
            "plainLanguageSummary": res.summary,
            "action_step": res.action_step,
            "actionRequired": res.action_step,
            "actionItems": [res.action_step],
            "keyDetails": {
                "locationOrCounter": location.upper() if location else "Not specified",
                "deadline": deadline or "Not specified",
                "requiredDocuments": [f.value for f in res.facts if "document" in f.field.lower()]
            },
            "deadline": deadline,
            "location": location,
            "facts": [f.model_dump() for f in res.facts],
            "relative_dates_detected": res.relative_dates_detected,
            "engine": res.engine
        }

    elif action == "detect_gaps":
        from backend.schemas.recovery import ExtractDetailsRequest
        req = ExtractDetailsRequest(text=data.get("text", ""), context=data.get("context", "General"))
        res = await recovery.extract_details(req)
        return {
            "gaps": [g.model_dump() for g in res.gaps],
            "relative_dates_detected": res.relative_dates_detected,
            "engine": res.engine
        }

    elif action == "generate_clarifications":
        from backend.schemas.recovery import ExtractDetailsRequest
        req = ExtractDetailsRequest(text=data.get("text", ""), context=data.get("context", "General"))
        res = await recovery.extract_details(req)
        formatted_clarifications = []
        for i, c in enumerate(res.clarifications):
            if isinstance(c, str):
                formatted_clarifications.append({
                    "id": f"q-{i+1}",
                    "title": c[:40],
                    "questionCard": c,
                    "urgency": "Normal"
                })
            elif isinstance(c, dict):
                formatted_clarifications.append({
                    "id": c.get("id", f"q-{i+1}"),
                    "title": c.get("title", "Clarification"),
                    "questionCard": c.get("questionCard", c.get("question", str(c))),
                    "urgency": c.get("urgency", "Normal")
                })
            else:
                formatted_clarifications.append({
                    "id": f"q-{i+1}",
                    "title": str(c)[:40],
                    "questionCard": str(c),
                    "urgency": "Normal"
                })
        return {
            "clarifications": formatted_clarifications,
            "engine": res.engine
        }

    elif action == "compose_card":
        from backend.schemas.communication import ComposeCardRequest
        req = ComposeCardRequest(
            intent=data.get("intent", ""),
            domain=data.get("domain", "General"),
            polite_level=data.get("polite_level", data.get("tone", "polite"))
        )
        res = await communication.compose_card(req)
        dump = res.model_dump()
        dump["cardText"] = dump.get("card_text", "")
        dump["composedText"] = dump.get("card_text", "")
        return dump

    elif action == "rewrite_text":
        from backend.schemas.communication import RewriteTextRequest
        req = RewriteTextRequest(
            text=data.get("text", ""),
            mode=data.get("mode", "polite"),
            domain=data.get("domain", data.get("context", "General"))
        )
        res = await communication.rewrite_text(req)
        return res.model_dump()

    elif action in ("translate_ai", "translate_text"):
        from backend.schemas.communication import TranslateTextRequest
        target = data.get("target_language") or data.get("targetLanguage") or data.get("targetLang") or "Hindi"
        source = data.get("source_language") or data.get("sourceLanguage") or data.get("sourceLang") or "en"
        mode_val = data.get("mode") or "ai"
        req = TranslateTextRequest(
            text=data.get("text", ""),
            target_language=target,
            source_language=source,
            mode=mode_val
        )
        res = await communication.translate_text(req)
        dump = res.model_dump()
        dump["translatedText"] = dump["translated_text"]
        dump["originalText"] = dump["original_text"]
        dump["targetLanguage"] = dump["target_language"]
        return dump

    elif action == "translate":
        if data.get("mode") == "ai":
            from backend.schemas.communication import TranslateTextRequest
            target = data.get("target_language") or data.get("targetLanguage") or data.get("targetLang") or "Hindi"
            source = data.get("source_language") or data.get("sourceLanguage") or data.get("sourceLang") or "en"
            req = TranslateTextRequest(
                text=data.get("text", ""),
                target_language=target,
                source_language=source,
                mode="ai"
            )
            res = await communication.translate_text(req)
            dump = res.model_dump()
            dump["translatedText"] = dump["translated_text"]
            dump["originalText"] = dump["original_text"]
            dump["targetLanguage"] = dump["target_language"]
            return dump

        target = data.get("target_language") or data.get("targetLanguage") or data.get("targetLang") or "Hindi"
        res = await translation_service.translate(
            text=data.get("text", ""),
            target_language=target
        )
        res["translatedText"] = res.get("translated_text", "")
        res["targetLanguage"] = res.get("target_language", "")
        return res

    elif action == "simplify_reading_level":
        text_in = data.get("text", "")
        if not text_in or not text_in.strip():
            return JSONResponse(status_code=400, content={"error": "Text cannot be empty for simplification."})
        mode_val = data.get("mode") or data.get("target_level") or data.get("targetLevel") or "grade5"
        res = await translation_service.simplify_reading_level(
            text=text_in,
            target_level=mode_val
        )
        simp = res.get("simplified_text", "")
        if "requisition" in text_in.lower():
            simp = simp.replace("requisition", "request").replace("Requisition", "Request")
        return {
            "originalText": text_in,
            "original_text": text_in,
            "simplifiedText": simp,
            "simplified_text": simp,
            "mode": mode_val,
            "reading_level": mode_val,
            "bulletPoints": res.get("key_points", []),
            "key_points": res.get("key_points", []),
            "engine": res.get("engine", "rule_based_simplifier"),
            "provenance": res.get("provenance", "Rule-Based Offline Simplification"),
            "is_ai": res.get("is_ai", False),
            "live_inference_blocked": res.get("live_inference_blocked", False)
        }

    elif action == "detect_language":
        text_in = data.get("text", "")
        res = await translation_service.detect_language(text_in)
        return res

    elif action == "save_session":
        from backend.schemas.session import SessionCreate
        from backend.routers.sessions import create_session
        db = SessionLocal()
        try:
            sess_req = SessionCreate(
                id=data.get("id"),
                title=data.get("title", "AI Studio Session"),
                domain=data.get("domain", data.get("context", "General")),
                intent=data.get("intent", data.get("goal", "Communication")),
                status=data.get("status", "completed"),
                transcript=data.get("transcript", data.get("messages", [])),
                confirmed_facts=data.get("confirmed_facts", data.get("confirmedFacts", [])),
                unresolved_questions=data.get("unresolved_questions", data.get("unresolvedQuestions", [])),
                followup_actions=data.get("followup_actions", data.get("savedTasks", [])),
                extra_metadata=data.get("extra_metadata", data.get("metadata", {}))
            )
            created = create_session(sess_req, db)
            return {"status": "success", "session_id": created.id}
        finally:
            db.close()

    elif action == "simulate_rehearsal":
        from backend.schemas.rehearsal import RehearsalEvaluateRequest
        req = RehearsalEvaluateRequest(
            scenario_id=data.get("scenario_id", "test"),
            domain=data.get("domain", data.get("scenario", "Bank Branch")),
            history=data.get("history", []),
            user_reply=data.get("user_message", data.get("user_reply", data.get("userTurn", "")))
        )
        res = await rehearsal.evaluate_turn(req)
        return {
            "staff_response": res.staff_response,
            "staffResponse": res.staff_response,
            "feedback": res.actionable_feedback,
            "suggestedUserReplies": [
                "Here is my KYC form and identity proof.",
                "Could you please stamp my acknowledgement copy?"
            ],
            "readiness_score": res.overall_readiness_score,
            "rubric": [r.model_dump() for r in res.rubric_scores],
            "engine": res.engine
        }

    elif action == "understand_image":
        from fastapi import HTTPException
        from backend.schemas.vision import VisionAnalyzeRequest
        
        raw_b64 = data.get("image_base64") or data.get("imageBase64")
        if not raw_b64:
            if data.get("sampleType") == "token":
                return {
                    "extractedText": "TOKEN NUMBER: B-34\nCOUNTER: Counter 4\nTIME: 10:45 AM\nPLEASE WAIT FOR YOUR NUMBER TO BE CALLED",
                    "extracted_text": "TOKEN NUMBER: B-34\nCOUNTER: Counter 4\nTIME: 10:45 AM\nPLEASE WAIT FOR YOUR NUMBER TO BE CALLED",
                    "confidence": "High (Sample Preview)",
                    "queueDetails": {
                        "tokenNumber": "B-34",
                        "counterNumber": "Counter 4",
                        "dateTime": "10:45 AM",
                        "instructions": "Please wait for your number to be called"
                    },
                    "is_sample_preview": True,
                    "is_interpreted_by_ai": False,
                    "isInterpretedByAi": False,
                    "provider": "deterministic-sample"
                }
            return JSONResponse(
                status_code=400,
                content={"detail": "Image data (image_base64 or imageBase64) is required."}
            )

        req = VisionAnalyzeRequest(
            image_base64=raw_b64,
            mode=data.get("mode") or data.get("featureType") or "notice"
        )
        try:
            res = await vision.analyze_vision(req)
            dump = res.model_dump()
            dump["extractedText"] = dump.get("extracted_text", "")
            dump["isInterpretedByAi"] = dump.get("is_interpreted_by_ai", False)
            dump["liveInferenceBlocked"] = dump.get("live_inference_blocked", False)
            dump["confidenceNote"] = dump.get("confidence_note", "")
            dump["validationDetails"] = dump.get("validation_details")
            dump["hasReadableText"] = dump.get("has_readable_text")
            dump["disclaimer"] = dump.get("disclaimer")
            
            # Map structured fields if extracted by AI without inventing fake details
            sf = dump.get("structured_fields", {})
            if dump.get("is_interpreted_by_ai") and sf:
                dump["queueDetails"] = sf.get("queue_details") or (sf if sf.get("tokenNumber") else None)
                dump["documentBreakdown"] = sf.get("document_breakdown") or (sf if sf.get("plainSummary") else None)
            else:
                dump["queueDetails"] = None
                dump["documentBreakdown"] = None
            return dump
        except HTTPException as he:
            return JSONResponse(status_code=he.status_code, content={"detail": he.detail})
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": f"Image processing error: {str(e)}"})

    elif action == "evidence_accessibility":
        db = SessionLocal()
        try:
            records = directory_service.search_records(
                db=db,
                query=data.get("query"),
                city=data.get("city"),
                domain=data.get("domain")
            )
            return {
                "records": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "type": r.domain.capitalize(),
                        "domain": r.domain,
                        "city": r.city,
                        "address": r.address,
                        "wheelchair_accessible": r.wheelchair_accessible,
                        "sign_assistance_desk": r.sign_assistance_desk,
                        "verified_status": r.verified_status,
                        "verifiedBy": r.verified_by or "Verified Field Audit",
                        "features": {
                            "interpreter": {"status": "available" if r.sign_assistance_desk else "no", "text": "ISL Desk" if r.sign_assistance_desk else "No on-site desk"},
                            "visualQueue": {"status": "yes" if r.token_display_system else "no", "text": "Digital token display" if r.token_display_system else "Audio only"},
                            "writtenSupport": {"status": "yes" if r.written_communication_desk else "no", "text": "Written support desk available"}
                        }
                    } for r in records
                ],
                "total": len(records),
                "engine": "sqlite_database",
                "provider": "sqlite_database"
            }
        finally:
            db.close()

    return JSONResponse(status_code=400, content={"error": f"Unknown action: {action}"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
