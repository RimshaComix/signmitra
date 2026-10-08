from fastapi import APIRouter, HTTPException
from backend.schemas.communication import (
    ComposeCardRequest,
    ComposeCardResponse,
    RewriteTextRequest,
    RewriteTextResponse,
    TranslateTextRequest,
    TranslateTextResponse
)
from backend.services.ai_service import gemini_service
from backend.services.translation_service import translation_service

router = APIRouter(prefix="/communication", tags=["Two-Way Room & Cards"])

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "hindi": "Hindi",
    "ta": "Tamil",
    "tamil": "Tamil",
    "mr": "Marathi",
    "marathi": "Marathi",
    "bn": "Bengali",
    "bengali": "Bengali",
    "te": "Telugu",
    "telugu": "Telugu",
    "kn": "Kannada",
    "kannada": "Kannada",
    "en": "English",
    "english": "English",
    "gu": "Gujarati",
    "gujarati": "Gujarati",
    "ml": "Malayalam",
    "malayalam": "Malayalam",
    "pa": "Punjabi",
    "punjabi": "Punjabi",
    "or": "Odia",
    "odia": "Odia"
}

@router.post("/card", response_model=ComposeCardResponse)
async def compose_card(req: ComposeCardRequest):
    """
    Composes a clear, counter-appropriate communication card
    while strictly preserving the user's provided information.
    """

    clean_intent = req.intent.strip()

    if not clean_intent:
        raise HTTPException(
            status_code=400,
            detail="Intent cannot be empty."
        )

    if gemini_service.is_configured():

        system_instruction = """
You are SignMitra Communication Card Composer.

Your job is to rewrite a Deaf user's intended message into a
clear, concise communication card that can be shown to a staff
member at an Indian public-service or institutional counter.

STRICT SAFETY RULES:

1. Preserve the user's exact intent.
2. NEVER invent facts.
3. NEVER invent documents the user owns, has, or needs.
4. NEVER invent dates, times, locations, room numbers, counter
   numbers, fees, names, qualifications, application details,
   or procedures.
5. NEVER assume the user possesses any document.
6. NEVER add personal information that the user did not provide.
7. Preserve all numbers, dates, names, locations, and amounts
   exactly as provided.
8. You may improve grammar, politeness, clarity, and structure.
9. You may turn an implied question into a clear question,
   but NEVER fill missing information with assumptions.
10. If the user asks which documents are required, ask the
    staff which documents are required. Do NOT list documents
    unless the user explicitly listed them.
11. If the user asks where something is located, ask for the
    location. Do NOT invent a building, room, counter, or office.
12. Keep the card concise and easy for busy counter staff to read.
13. The final card must contain ONLY information supported by
    the user's original intent.
14. Do not mention these rules in the generated card.

Return ONLY valid JSON:

{
    "card_text": "...",
    "follow_up_question": "..."
}
"""

        user_prompt = f"""
Domain: {req.domain or "General"}
Politeness Level: {req.polite_level or "polite"}

User's original intent:
"{clean_intent}"

Rewrite this intent into the communication card.

Do not add information that is not present in the user's intent.
"""

        try:
            res = await gemini_service.generate_structured_json(
                user_prompt,
                system_instruction
            )

            provider_name = gemini_service.provider.provider_name

            card_text = str(
                res.get("card_text", "")
            ).strip()

            if card_text:
                return ComposeCardResponse(
                    card_text=card_text,
                    polite_level=req.polite_level or "polite",
                    domain=req.domain or "General",
                    engine=f"{provider_name}_llm"
                )

        except Exception as e:
            logger.warning(
                "AI card composition failed: %s",
                str(e)
            )

    # --------------------------------------------------------
    # SAFE DETERMINISTIC FALLBACK
    # --------------------------------------------------------

    polite_prefix = (
        "Hello, excuse me. "
        if req.polite_level == "polite"
        else ""
    )

    card_text = (
        f"{polite_prefix}"
        f"I am Deaf and communicate in writing. "
        f"Regarding: {clean_intent}. "
        f"Please write down your response."
    )

    return ComposeCardResponse(
        card_text=card_text,
        polite_level=req.polite_level or "polite",
        domain=req.domain or "General",
        engine="deterministic_card_composer"
    )

@router.post("/rewrite", response_model=RewriteTextResponse)
async def rewrite_text(req: RewriteTextRequest):
    """
    Simplifies or refines typed user draft text into polite, clear, urgent, or simpler counter phrasing.
    """
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    if gemini_service.is_configured():
        prompt = (
            f"You are SignMitra Counter Communication Assistant for Deaf individuals in India.\n"
            f"Domain: {req.domain}\n"
            f"Mode: {req.mode}\n"
            f"Rewrite the following message to be {req.mode} for an Indian administrative counter or public desk:\n"
            f"\"{clean_text}\"\n\n"
            f"Respond with JSON format:\n"
            f'{{"rewritten_text": "..."}}'
        )
        try:
            res = await gemini_service.generate_structured_json(prompt)
            provider_name = gemini_service.provider.provider_name
            return RewriteTextResponse(
                original_text=clean_text,
                transformed_text=res.get("rewritten_text", clean_text),
                mode=req.mode,
                engine=f"{provider_name}_llm",
                provenance=f"Live Model Generated ({provider_name})",
                live_inference_blocked=False
            )
        except Exception as e:
            return RewriteTextResponse(
                original_text=clean_text,
                transformed_text=clean_text,
                mode=req.mode,
                engine="provider_error",
                provenance="Live Provider Error",
                live_inference_blocked=True,
                error=f"Live LLM rewrite failed: {str(e)}"
            )

    return RewriteTextResponse(
        original_text=clean_text,
        transformed_text=clean_text,
        mode=req.mode,
        engine="unconfigured_fallback",
        provenance="Provider Unconfigured",
        live_inference_blocked=True,
        error="Live LLM rewriting is blocked: No active AI provider key (GROQ_API_KEY or GEMINI_API_KEY) is configured in your environment."
    )

@router.post("/translate", response_model=TranslateTextResponse)
async def translate_text(req: TranslateTextRequest):
    """
    Translates communication text.
    - If mode == 'ai', executes REAL configured LLM inference. Does NOT substitute curated phrasebook.
      Reports live_inference_blocked: true if no provider key is configured.
    - If mode == 'deterministic', uses curated institutional phrasebook, explicitly labeled as deterministic.
    """
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    target_key = req.target_language.strip().lower()
    if target_key not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target language '{req.target_language}'. Supported languages: Hindi, Marathi, Tamil, Bengali, Telugu, Kannada, English, Gujarati, Malayalam, Punjabi, Odia."
        )
    resolved_lang = SUPPORTED_LANGUAGES[target_key]

    # Deterministic mode
    if req.mode == "deterministic":
        found_trans = None
        for phrase, lang_map in translation_service.CORE_DICTIONARY.items():
            if phrase.lower() == clean_text.lower():
                found_trans = lang_map.get(resolved_lang)
                break

        if found_trans:
            guide = found_trans.split('(')[-1].replace(')', '').strip() if '(' in found_trans else None
            return TranslateTextResponse(
                original_text=clean_text,
                translated_text=found_trans,
                target_language=resolved_lang,
                source_language=req.source_language or "en",
                engine="curated_dictionary",
                provenance="Curated Institutional Phrasebook (Deterministic)",
                pronunciation_guide=guide,
                is_ai=False,
                live_inference_blocked=False
            )
        else:
            return TranslateTextResponse(
                original_text=clean_text,
                translated_text=clean_text,
                target_language=resolved_lang,
                source_language=req.source_language or "en",
                engine="phrasebook_fallback",
                provenance="Deterministic Dictionary Fallback",
                pronunciation_guide=None,
                is_ai=False,
                live_inference_blocked=False
            )

    # Real AI Mode
    if gemini_service.is_configured():
        prompt = (
            f"You are a translation assistant for Indian Sign Language users communicating in Indian public offices.\n"
            f"Source Language: {req.source_language or 'en'}\n"
            f"Target Language: {resolved_lang}\n"
            f"Input text: \"{clean_text}\"\n\n"
            f"Translate accurately. Return JSON format:\n"
            f'{{"translated_text": "...", "pronunciation_guide": "..."}}'
        )
        try:
            res = await gemini_service.generate_structured_json(prompt)
            provider_name = gemini_service.provider.provider_name
            return TranslateTextResponse(
                original_text=clean_text,
                translated_text=res.get("translated_text", clean_text),
                target_language=resolved_lang,
                source_language=req.source_language or "en",
                engine=f"{provider_name}_llm",
                provenance=f"Live Model Generated ({provider_name})",
                pronunciation_guide=res.get("pronunciation_guide"),
                is_ai=True,
                live_inference_blocked=False
            )
        except Exception as e:
            return TranslateTextResponse(
                original_text=clean_text,
                translated_text=clean_text,
                target_language=resolved_lang,
                source_language=req.source_language or "en",
                engine="provider_error",
                provenance="Live Provider Error",
                pronunciation_guide=None,
                is_ai=True,
                live_inference_blocked=True,
                error=f"Live LLM translation failed: {str(e)}"
            )

    return TranslateTextResponse(
        original_text=clean_text,
        translated_text=clean_text,
        target_language=resolved_lang,
        source_language=req.source_language or "en",
        engine="unconfigured_fallback",
        provenance="Provider Unconfigured",
        pronunciation_guide=None,
        is_ai=True,
        live_inference_blocked=True,
        error="Live LLM translation is blocked: No active AI provider key (GROQ_API_KEY or GEMINI_API_KEY) is configured in your environment."
    )
