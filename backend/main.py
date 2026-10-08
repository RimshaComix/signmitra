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
    isl,
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("signmitra.main")


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def first_visible(*values):
    for value in values:
        if value not in (
            None,
            "",
            "Not visible",
            "N/A",
            "Unknown",
        ):
            return value

    return "Not visible"


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SignMitra Database tables...")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        directory_service.seed_initial_records_if_empty(db)
        logger.info("Database verification and seeding completed.")
    finally:
        db.close()

    # Reload ISL Static V1 model weights
    from backend.isl.predict import predictor

    loaded = predictor.reload_weights(force=True)

    logger.info(
        "ISL Static V1 model weights reload at startup: loaded=%s",
        loaded,
    )

    yield

    logger.info("Shutting down SignMitra AI Backend.")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "SignMitra AI Studio Python Backend providing LLM, OCR, "
        "Ambiguity Detection, and Verified Accessibility persistence."
    ),
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL ERROR HANDLER
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception at %s %s: %s",
        request.method,
        request.url.path,
        str(exc),
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": (
                "An internal server error occurred. "
                "Please check server logs."
            )
        },
    )


# ============================================================
# ROUTERS
# ============================================================

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


# ============================================================
# ROOT-LEVEL ISL RECOGNITION ENDPOINTS
# ============================================================

from backend.isl.app import (
    get_isl_health_payload,
    run_isl_prediction,
)


@app.get("/health")
def root_isl_health():
    return get_isl_health_payload()


@app.post("/predict")
def root_isl_predict(payload: dict):
    return run_isl_prediction(payload)


# ============================================================
# AI STUDIO COMPATIBILITY DISPATCHER
# ============================================================

@app.post("/api/ai-studio")
async def ai_studio_action_dispatcher(payload: dict):
    """
    Unified action dispatcher for frontend compatibility.

    The Next.js frontend sends:

        {
            "action": "...",
            "data": {...}
        }

    This dispatcher maps legacy/frontend action names
    to the appropriate modular backend services.
    """

    action = payload.get("action")
    data = payload.get("data", {})

    if not action:
        return JSONResponse(
            status_code=400,
            content={"error": "Missing 'action' parameter."},
        )

    # Services imported for compatibility with existing actions.
    from backend.services.ai_service import gemini_service
    from backend.services.ambiguity_service import ambiguity_service
    from backend.services.translation_service import translation_service
    from backend.services.ocr_service import ocr_service
    from backend.services.rehearsal_service import rehearsal_service

    # ========================================================
    # COPILOT PREPARE
    # ========================================================

    if action == "copilot_prepare":
        from backend.schemas.recovery import RecoveryPrepareRequest

        req = RecoveryPrepareRequest(
            context=data.get("context", "General"),
            goal=data.get("goal", ""),
            preferences=data.get(
                "preferences",
                "Writing + Large Text",
            ),
            institution=data.get("institution"),
        )

        res = await recovery.prepare_interaction(req)

        dump = res.model_dump()

        dump["suggestedCards"] = dump.get("cards", [])
        dump["suggestedDocuments"] = dump.get(
            "required_documents",
            [],
        )
        dump["requiredDocuments"] = dump.get(
            "required_documents",
            [],
        )

        return dump

    # ========================================================
    # EXPLAIN PLAIN LANGUAGE
    # ========================================================

    elif action == "explain_plain_language":
        from backend.schemas.recovery import ExtractDetailsRequest

        req = ExtractDetailsRequest(
            text=data.get("text", ""),
            context=data.get("context", "General"),
        )

        res = await recovery.extract_details(req)

        location = next(
            (
                f.value
                for f in res.facts
                if "location" in f.field.lower()
            ),
            "",
        )

        deadline = next(
            (
                f.value
                for f in res.facts
                if (
                    "date" in f.field.lower()
                    or "deadline" in f.field.lower()
                    or "time" in f.field.lower()
                )
            ),
            "",
        )

        if not deadline and res.relative_dates_detected:
            deadline = ", ".join(res.relative_dates_detected)

        return {
            "summary": res.summary,
            "plainLanguageSummary": res.summary,
            "action_step": res.action_step,
            "actionRequired": res.action_step,
            "actionItems": [res.action_step],
            "keyDetails": {
                "locationOrCounter": (
                    location.upper()
                    if location
                    else "Not specified"
                ),
                "deadline": deadline or "Not specified",
                "requiredDocuments": [
                    f.value
                    for f in res.facts
                    if "document" in f.field.lower()
                ],
            },
            "deadline": deadline,
            "location": location,
            "facts": [
                f.model_dump()
                for f in res.facts
            ],
            "relative_dates_detected": res.relative_dates_detected,
            "engine": res.engine,
        }

    # ========================================================
    # DETECT GAPS
    # ========================================================

    elif action == "detect_gaps":
        from backend.schemas.recovery import ExtractDetailsRequest

        req = ExtractDetailsRequest(
            text=data.get("text", ""),
            context=data.get("context", "General"),
        )

        res = await recovery.extract_details(req)

        return {
            "gaps": [
                g.model_dump()
                for g in res.gaps
            ],
            "relative_dates_detected": res.relative_dates_detected,
            "engine": res.engine,
        }

    # ========================================================
    # GENERATE CLARIFICATIONS
    # ========================================================

    elif action == "generate_clarifications":
        from backend.schemas.recovery import ExtractDetailsRequest

        req = ExtractDetailsRequest(
            text=data.get("text", ""),
            context=data.get("context", "General"),
        )

        res = await recovery.extract_details(req)

        formatted_clarifications = []

        for i, c in enumerate(res.clarifications):

            if isinstance(c, str):
                formatted_clarifications.append(
                    {
                        "id": f"q-{i + 1}",
                        "title": c[:40],
                        "questionCard": c,
                        "urgency": "Normal",
                    }
                )

            elif isinstance(c, dict):
                formatted_clarifications.append(
                    {
                        "id": c.get(
                            "id",
                            f"q-{i + 1}",
                        ),
                        "title": c.get(
                            "title",
                            "Clarification",
                        ),
                        "questionCard": c.get(
                            "questionCard",
                            c.get(
                                "question",
                                str(c),
                            ),
                        ),
                        "urgency": c.get(
                            "urgency",
                            "Normal",
                        ),
                    }
                )

            else:
                formatted_clarifications.append(
                    {
                        "id": f"q-{i + 1}",
                        "title": str(c)[:40],
                        "questionCard": str(c),
                        "urgency": "Normal",
                    }
                )

        return {
            "clarifications": formatted_clarifications,
            "engine": res.engine,
        }

    # ========================================================
    # COMPOSE CARD
    # ========================================================

    elif action == "compose_card":
        from backend.schemas.communication import ComposeCardRequest

        req = ComposeCardRequest(
            intent=data.get("intent", ""),
            domain=data.get("domain", "General"),
            polite_level=data.get(
                "polite_level",
                data.get("tone", "polite"),
            ),
        )

        res = await communication.compose_card(req)

        dump = res.model_dump()

        dump["cardText"] = dump.get(
            "card_text",
            "",
        )

        dump["composedText"] = dump.get(
            "card_text",
            "",
        )

        return dump

    # ========================================================
    # REWRITE TEXT
    # ========================================================

    elif action == "rewrite_text":
        from backend.schemas.communication import RewriteTextRequest

        req = RewriteTextRequest(
            text=data.get("text", ""),
            mode=data.get("mode", "polite"),
            domain=data.get(
                "domain",
                data.get("context", "General"),
            ),
        )

        res = await communication.rewrite_text(req)

        return res.model_dump()

    # ========================================================
    # TRANSLATION
    # ========================================================

    elif action in ("translate_ai", "translate_text"):
        from backend.schemas.communication import TranslateTextRequest

        target = (
            data.get("target_language")
            or data.get("targetLanguage")
            or data.get("targetLang")
            or "Hindi"
        )

        source = (
            data.get("source_language")
            or data.get("sourceLanguage")
            or data.get("sourceLang")
            or "en"
        )

        mode_val = data.get("mode") or "ai"

        req = TranslateTextRequest(
            text=data.get("text", ""),
            target_language=target,
            source_language=source,
            mode=mode_val,
        )

        res = await communication.translate_text(req)

        dump = res.model_dump()

        dump["translatedText"] = dump.get(
            "translated_text",
            "",
        )

        dump["originalText"] = dump.get(
            "original_text",
            data.get("text", ""),
        )

        dump["targetLanguage"] = dump.get(
            "target_language",
            target,
        )

        dump["sourceLanguage"] = dump.get(
            "source_language",
            source,
        )

        return dump

    # ========================================================
    # TRANSLATE
    # ========================================================

    elif action == "translate":
        from backend.schemas.communication import TranslateTextRequest

        text = data.get("text", "").strip()

        if not text:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Text cannot be empty for translation."
                },
            )

        target = (
            data.get("target_language")
            or data.get("targetLanguage")
            or data.get("targetLang")
            or "Hindi"
        )

        source = (
            data.get("source_language")
            or data.get("sourceLanguage")
            or data.get("sourceLang")
            or "en"
        )

        req = TranslateTextRequest(
            text=text,
            target_language=target,
            source_language=source,
            mode="ai",
        )

        logger.info(
            "Translation request: source=%s target=%s chars=%d",
            source,
            target,
            len(text),
        )

        res = await communication.translate_text(req)

        dump = res.model_dump()

        dump["translatedText"] = dump.get(
            "translated_text",
            "",
        )

        dump["originalText"] = dump.get(
            "original_text",
            text,
        )

        dump["targetLanguage"] = dump.get(
            "target_language",
            target,
        )

        dump["sourceLanguage"] = dump.get(
            "source_language",
            source,
        )

        return dump

    # ========================================================
    # SIMPLIFY READING LEVEL
    # ========================================================

    elif action == "simplify_reading_level":
        text_in = data.get("text", "")

        if not text_in or not text_in.strip():
            return JSONResponse(
                status_code=400,
                content={
                    "error": (
                        "Text cannot be empty for simplification."
                    )
                },
            )

        mode_val = (
            data.get("mode")
            or data.get("target_level")
            or data.get("targetLevel")
            or "grade5"
        )

        res = await translation_service.simplify_reading_level(
            text=text_in,
            target_level=mode_val,
        )

        simp = res.get(
            "simplified_text",
            "",
        )

        if "requisition" in text_in.lower():
            simp = simp.replace(
                "requisition",
                "request",
            ).replace(
                "Requisition",
                "Request",
            )

        return {
            "originalText": text_in,
            "original_text": text_in,
            "simplifiedText": simp,
            "simplified_text": simp,
            "mode": mode_val,
            "reading_level": mode_val,
            "bulletPoints": res.get(
                "key_points",
                [],
            ),
            "key_points": res.get(
                "key_points",
                [],
            ),
            "engine": res.get(
                "engine",
                "rule_based_simplifier",
            ),
            "provenance": res.get(
                "provenance",
                "Rule-Based Offline Simplification",
            ),
            "is_ai": res.get(
                "is_ai",
                False,
            ),
            "live_inference_blocked": res.get(
                "live_inference_blocked",
                False,
            ),
        }

    # ========================================================
    # LANGUAGE DETECTION
    # ========================================================

    elif action == "detect_language":
        text_in = data.get("text", "")

        res = await translation_service.detect_language(
            text_in
        )

        return res

    # ========================================================
    # SAVE SESSION
    # ========================================================

    elif action == "save_session":
        from backend.schemas.session import SessionCreate
        from backend.routers.sessions import create_session

        db = SessionLocal()

        try:
            sess_req = SessionCreate(
                id=data.get("id"),
                title=data.get(
                    "title",
                    "AI Studio Session",
                ),
                domain=data.get(
                    "domain",
                    data.get(
                        "context",
                        "General",
                    ),
                ),
                intent=data.get(
                    "intent",
                    data.get(
                        "goal",
                        "Communication",
                    ),
                ),
                status=data.get(
                    "status",
                    "completed",
                ),
                transcript=data.get(
                    "transcript",
                    data.get(
                        "messages",
                        [],
                    ),
                ),
                confirmed_facts=data.get(
                    "confirmed_facts",
                    data.get(
                        "confirmedFacts",
                        [],
                    ),
                ),
                unresolved_questions=data.get(
                    "unresolved_questions",
                    data.get(
                        "unresolvedQuestions",
                        [],
                    ),
                ),
                followup_actions=data.get(
                    "followup_actions",
                    data.get(
                        "savedTasks",
                        [],
                    ),
                ),
                extra_metadata=data.get(
                    "extra_metadata",
                    data.get(
                        "metadata",
                        {},
                    ),
                ),
            )

            created = create_session(
                sess_req,
                db,
            )

            return {
                "status": "success",
                "session_id": created.id,
            }

        finally:
            db.close()

    # ========================================================
    # SIMULATE REHEARSAL
    # ========================================================

    elif action == "simulate_rehearsal":
        from backend.schemas.rehearsal import RehearsalEvaluateRequest

        scenario = data.get(
            "scenario",
            data.get(
                "domain",
                "College Office",
            ),
        )

        req = RehearsalEvaluateRequest(
            scenario_id=data.get(
                "scenario_id",
                scenario,
            ),
            domain=scenario,
            history=data.get(
                "history",
                [],
            ),
            user_reply=data.get(
                "user_message",
                data.get(
                    "user_reply",
                    data.get(
                        "userTurn",
                        "",
                    ),
                ),
            ),
        )

        res = await rehearsal.evaluate_turn(req)

        scenario_suggestions = {
            "College Office": [
                "I need to submit my exam form.",
                "Could you please write down the required documents?",
                "Could I get an acknowledgement for my submission?",
            ],
            "Bank Branch": [
                "I need to update my KYC address.",
                "Could you please write down the documents required?",
                "Could I get an acknowledgement for the documents I submit?",
            ],
            "Hospital OPD": [
                "I need help with my consultation registration.",
                "Could you please write down the next step?",
                "Could you please confirm where I should go next?",
            ],
            "Public Transit": [
                "Could you please confirm the platform for my train?",
                "I need boarding assistance.",
                "Could you please write down the platform information?",
            ],
        }

        return {
            "staff_response": res.staff_response,
            "staffResponse": res.staff_response,
            "feedback": res.actionable_feedback,
            "suggestedUserReplies": scenario_suggestions.get(
                scenario,
                [
                    "Could you please write that down?",
                    "Could you please explain the next step?",
                    "Could you please confirm that?",
                ],
            ),
            "readiness_score": res.overall_readiness_score,
            "rubric": [
                r.model_dump()
                for r in res.rubric_scores
            ],
            "engine": res.engine,
        }

    # ========================================================
    # IMAGE / OCR UNDERSTANDING
    # ========================================================

    elif action == "understand_image":
        from fastapi import HTTPException
        from backend.schemas.vision import VisionAnalyzeRequest

        raw_b64 = (
            data.get("image_base64")
            or data.get("imageBase64")
        )

        # ----------------------------------------------------
        # DETERMINISTIC SAMPLE
        # ----------------------------------------------------

        if not raw_b64:

            if data.get("sampleType") == "token":
                return {
                    "extractedText": (
                        "TOKEN NUMBER: B-34\n"
                        "COUNTER: Counter 4\n"
                        "TIME: 10:45 AM\n"
                        "PLEASE WAIT FOR YOUR NUMBER TO BE CALLED"
                    ),
                    "extracted_text": (
                        "TOKEN NUMBER: B-34\n"
                        "COUNTER: Counter 4\n"
                        "TIME: 10:45 AM\n"
                        "PLEASE WAIT FOR YOUR NUMBER TO BE CALLED"
                    ),
                    "confidence": "High (Sample Preview)",
                    "queueDetails": {
                        "tokenNumber": "B-34",
                        "counterNumber": "Counter 4",
                        "dateTime": "10:45 AM",
                        "instructions": (
                            "Please wait for your number to be called"
                        ),
                    },
                    "is_sample_preview": True,
                    "is_interpreted_by_ai": False,
                    "isInterpretedByAi": False,
                    "provider": "deterministic-sample",
                }

            return JSONResponse(
                status_code=400,
                content={
                    "detail": (
                        "Image data "
                        "(image_base64 or imageBase64) "
                        "is required."
                    )
                },
            )

        # ----------------------------------------------------
        # REAL IMAGE
        # ----------------------------------------------------

        req = VisionAnalyzeRequest(
            image_base64=raw_b64,
            mode=(
                data.get("mode")
                or data.get("featureType")
                or "notice"
            ),
        )

        try:
            res = await vision.analyze_vision(req)

            dump = res.model_dump()

            # ------------------------------------------------
            # FRONTEND COMPATIBILITY FIELDS
            # ------------------------------------------------

            dump["extractedText"] = dump.get(
                "extracted_text",
                "",
            )

            dump["isInterpretedByAi"] = dump.get(
                "is_interpreted_by_ai",
                False,
            )

            dump["liveInferenceBlocked"] = dump.get(
                "live_inference_blocked",
                False,
            )

            dump["confidenceNote"] = dump.get(
                "confidence_note",
                "",
            )

            dump["validationDetails"] = dump.get(
                "validation_details"
            )

            dump["hasReadableText"] = dump.get(
                "has_readable_text"
            )

            dump["disclaimer"] = dump.get(
                "disclaimer"
            )

            # ------------------------------------------------
            # PROVIDER / PROVENANCE NORMALIZATION
            # ------------------------------------------------

            provider = (
                dump.get("provenance")
                or dump.get("engine")
                or ""
            )

            if provider:
                dump["provider"] = provider

            # ------------------------------------------------
            # STRUCTURED AI FIELDS
            # ------------------------------------------------

            sf = dump.get(
                "structured_fields",
                {},
            )

            if (
                dump.get("is_interpreted_by_ai")
                and isinstance(sf, dict)
            ):

                # --------------------------------------------
                # COMPLETE GENERIC DOCUMENT DATA
                # --------------------------------------------

                dump["documentDetails"] = sf
                dump["genericDocumentDetails"] = sf

                # --------------------------------------------
                # DOCUMENT CATEGORY
                # --------------------------------------------

                document_category = first_visible(
                    sf.get("document_category"),
                    sf.get("documentCategory"),
                )

                dump["documentCategory"] = document_category

                # --------------------------------------------
                # BUSINESS / ORGANIZATION
                # --------------------------------------------

                dump["businessName"] = first_visible(
                    sf.get("business_name"),
                    sf.get("businessName"),
                )

                # --------------------------------------------
                # DOCUMENT NUMBERS
                # --------------------------------------------

                dump["documentNumber"] = first_visible(
                    sf.get("document_number"),
                    sf.get("documentNumber"),
                )

                dump["billNumber"] = first_visible(
                    sf.get("bill_number"),
                    sf.get("billNumber"),
                )

                dump["invoiceNumber"] = first_visible(
                    sf.get("invoice_number"),
                    sf.get("invoiceNumber"),
                )

                dump["orderNumber"] = first_visible(
                    sf.get("order_number"),
                    sf.get("orderNumber"),
                )

                # --------------------------------------------
                # QUEUE / LOCATION / SERVICE FIELDS
                # --------------------------------------------

                token_number = first_visible(
                    sf.get("tokenNumber"),
                    sf.get("token_number"),
                )

                counter_number = first_visible(
                    sf.get("counterNumber"),
                    sf.get("counter_number"),
                )

                department = first_visible(
                    sf.get("department"),
                    sf.get("departmentName"),
                    sf.get("department_name"),
                )

                cashier = first_visible(
                    sf.get("cashier"),
                    sf.get("cashierName"),
                    sf.get("cashier_name"),
                )

                table_number = first_visible(
                    sf.get("tableNumber"),
                    sf.get("table_number"),
                )

                room_number = first_visible(
                    sf.get("roomNumber"),
                    sf.get("room_number"),
                    sf.get("room"),
                )

                service_type = first_visible(
                    sf.get("serviceType"),
                    sf.get("service_type"),
                )

                dump["tokenNumber"] = token_number
                dump["counterNumber"] = counter_number
                dump["department"] = department
                dump["cashier"] = cashier
                dump["tableNumber"] = table_number
                dump["roomNumber"] = room_number
                dump["serviceType"] = service_type

                # --------------------------------------------
                # PEOPLE / ROLE FIELDS
                # --------------------------------------------

                dump["customerName"] = first_visible(
                    sf.get("customer_name"),
                    sf.get("customerName"),
                )

                dump["patientName"] = first_visible(
                    sf.get("patient_name"),
                    sf.get("patientName"),
                )

                dump["doctorName"] = first_visible(
                    sf.get("doctor_name"),
                    sf.get("doctorName"),
                )

                # --------------------------------------------
                # DATE / TIME
                # --------------------------------------------

                dates = sf.get("dates") or []
                times = sf.get("times") or []

                date_time = first_visible(
                    sf.get("dateTime"),
                    sf.get("date_time"),
                )

                if date_time == "Not visible":

                    date_parts = [
                        str(value)
                        for value in dates
                        if value not in (
                            None,
                            "",
                            "Not visible",
                            "N/A",
                            "Unknown",
                        )
                    ]

                    time_parts = [
                        str(value)
                        for value in times
                        if value not in (
                            None,
                            "",
                            "Not visible",
                            "N/A",
                            "Unknown",
                        )
                    ]

                    combined = " ".join(
                        date_parts + time_parts
                    ).strip()

                    if combined:
                        date_time = combined

                dump["dateTime"] = date_time
                dump["dates"] = dates
                dump["times"] = times

                # --------------------------------------------
                # FINANCIAL INFORMATION
                # --------------------------------------------

                dump["currency"] = first_visible(
                    sf.get("currency"),
                )

                dump["subtotal"] = first_visible(
                    sf.get("subtotal"),
                )

                dump["tax"] = first_visible(
                    sf.get("tax"),
                )

                dump["discount"] = first_visible(
                    sf.get("discount"),
                )

                dump["totalAmount"] = first_visible(
                    sf.get("total_amount"),
                    sf.get("totalAmount"),
                    sf.get("total"),
                )

                dump["paymentMethod"] = first_visible(
                    sf.get("payment_method"),
                    sf.get("paymentMethod"),
                )

                # --------------------------------------------
                # ITEMS
                # --------------------------------------------

                items = sf.get("items")

                if not isinstance(items, list):
                    items = []

                dump["items"] = items

                # --------------------------------------------
                # CONTACT / ADDRESS
                # --------------------------------------------

                phone_numbers = sf.get("phone_numbers")

                if not isinstance(phone_numbers, list):
                    phone_numbers = []

                addresses = sf.get("addresses")

                if not isinstance(addresses, list):
                    addresses = []

                dump["phoneNumbers"] = phone_numbers
                dump["addresses"] = addresses

                # --------------------------------------------
                # DEADLINES / INSTRUCTIONS
                # --------------------------------------------

                deadlines = sf.get("deadlines") or []
                instructions = sf.get("instructions") or []

                if not isinstance(deadlines, list):
                    deadlines = [str(deadlines)]

                if not isinstance(instructions, list):
                    instructions = [str(instructions)]

                dump["deadlines"] = deadlines
                dump["instructions"] = instructions

                # --------------------------------------------
                # OTHER RELEVANT FIELDS
                # --------------------------------------------

                other_fields = sf.get(
                    "other_relevant_fields",
                    sf.get(
                        "otherRelevantFields",
                        {},
                    ),
                )

                if not isinstance(other_fields, dict):
                    other_fields = {}

                dump["otherRelevantFields"] = other_fields

                # --------------------------------------------
                # QUEUE & TOKEN READER COMPATIBILITY
                #
                # Only expose queueDetails when the image
                # actually contains queue/token-related data.
                #
                # A normal date, time, instruction, restaurant
                # bill, receipt, or invoice must NOT become
                # queue information.
                # --------------------------------------------

                document_type_text = str(
                    dump.get("detected_type", "")
                ).lower()

                document_category_text = str(
                    document_category
                ).lower()

                queue_keywords = (
                    "token",
                    "queue",
                    "appointment",
                    "opd",
                    "waiting",
                    "counter",
                )

                is_queue_document = any(
                    keyword in document_type_text
                    or keyword in document_category_text
                    for keyword in queue_keywords
                )

                has_explicit_queue_fields = any(
                    [
                        token_number != "Not visible",
                        counter_number != "Not visible",
                    ]
                )

                has_queue_data = (
                    is_queue_document
                    and has_explicit_queue_fields
                )

                dump["queueDetails"] = (
                    {
                        "tokenNumber": token_number,
                        "counterNumber": counter_number,
                        "dateTime": date_time,
                        "instructions": (
                            "; ".join(
                                str(item)
                                for item in instructions
                                if item not in (
                                    None,
                                    "",
                                    "Not visible",
                                )
                            )
                            or "Not visible"
                        ),
                    }
                    if has_queue_data
                    else None
                )

                # --------------------------------------------
                # DOCUMENT / NOTICE READER COMPATIBILITY
                # --------------------------------------------

                document_breakdown = (
                    sf.get("documentBreakdown")
                    or sf.get("document_breakdown")
                )

                if isinstance(
                    document_breakdown,
                    dict,
                ):
                    dump["documentBreakdown"] = {
                        "plainSummary": (
                            document_breakdown.get(
                                "plainSummary"
                            )
                            or document_breakdown.get(
                                "plain_summary"
                            )
                            or ""
                        ),
                        "keyDates": (
                            document_breakdown.get(
                                "keyDates"
                            )
                            or document_breakdown.get(
                                "key_dates"
                            )
                            or dates
                            or []
                        ),
                        "amounts": (
                            document_breakdown.get(
                                "amounts"
                            )
                            or []
                        ),
                        "actionItems": (
                            document_breakdown.get(
                                "actionItems"
                            )
                            or document_breakdown.get(
                                "action_items"
                            )
                            or instructions
                            or []
                        ),
                    }
                else:
                    dump["documentBreakdown"] = None

            else:
                dump["queueDetails"] = None
                dump["documentBreakdown"] = None
                dump["documentDetails"] = {}
                dump["genericDocumentDetails"] = {}

            return dump

        except HTTPException as he:
            return JSONResponse(
                status_code=he.status_code,
                content={"detail": he.detail},
            )

        except Exception as e:
            logger.exception(
                "Image processing error"
            )

            return JSONResponse(
                status_code=500,
                content={
                    "detail": (
                        f"Image processing error: {str(e)}"
                    )
                },
            )

    # ========================================================
    # ACCESSIBILITY DIRECTORY / EVIDENCE
    # ========================================================

    elif action == "evidence_accessibility":
        db = SessionLocal()

        try:
            records = directory_service.search_records(
                db=db,
                query=data.get("query"),
                city=data.get("city"),
                domain=data.get("domain"),
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
                        "wheelchair_accessible": (
                            r.wheelchair_accessible
                        ),
                        "sign_assistance_desk": (
                            r.sign_assistance_desk
                        ),
                        "verified_status": (
                            r.verified_status
                        ),
                        "verifiedBy": (
                            r.verified_by
                            or "Verified Field Audit"
                        ),
                        "features": {
                            "interpreter": {
                                "status": (
                                    "available"
                                    if r.sign_assistance_desk
                                    else "no"
                                ),
                                "text": (
                                    "ISL Desk"
                                    if r.sign_assistance_desk
                                    else "No on-site desk"
                                ),
                            },
                            "visualQueue": {
                                "status": (
                                    "yes"
                                    if r.token_display_system
                                    else "no"
                                ),
                                "text": (
                                    "Digital token display"
                                    if r.token_display_system
                                    else "Audio only"
                                ),
                            },
                            "writtenSupport": {
                                "status": "yes",
                                "text": (
                                    "Written support desk available"
                                ),
                            },
                        },
                    }
                    for r in records
                ],
                "total": len(records),
                "engine": "sqlite_database",
                "provider": "sqlite_database",
            }

        finally:
            db.close()

    # ========================================================
    # UNKNOWN ACTION
    # ========================================================

    return JSONResponse(
        status_code=400,
        content={
            "error": f"Unknown action: {action}"
        },
    )


# ============================================================
# DIRECT EXECUTION
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )