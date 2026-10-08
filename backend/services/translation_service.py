import re
from typing import Dict, Any

from backend.services.ai_service import gemini_service


class TranslationService:
    """
    SignMitra multilingual translation service.

    Supports:
    - English
    - All 22 languages listed in the Eighth Schedule of the
      Constitution of India.

    AI translation is performed through the configured AI provider.
    """

    # =========================================================
    # CURATED OFFLINE TRANSLATIONS
    # =========================================================

    CORE_DICTIONARY = {
        "Please communicate in writing": {
            "Hindi": "कृपया लिखकर बताएं (Kripya likhkar batayein)",
            "Marathi": "कृपया लिहून सांगा (Krupaya lihun sanga)",
            "Tamil": "தயவுசெய்து எழுதித் தெரிவிக்கவும் (Thayavuseithu ezhuthi therivikkavum)",
            "Bengali": "অনুগ্রহ করে লিখে জানান (Anugraha kore likhe janan)",
            "Telugu": "దయచేసి రాసి చెప్పండి (Dayachesi raasi cheppandi)",
            "Kannada": "ದಯವಿಟ್ಟು ಬರೆದು ತಿಳಿಸಿ (Dayavittu baredu thilisi)",
        },

        "Please write down the counter number": {
            "Hindi": "कृपया काउंटर नंबर लिखकर बताएं (Kripya counter number likhkar batayein)",
            "Marathi": "कृपया काउंटर नंबर लिहून द्या (Krupaya counter number lihun dya)",
            "Tamil": "தயவுசெய்து கவுண்டர் எண்ணை எழுதித் தரவும் (Thayavuseithu counter ennai ezhuthi tharavum)",
            "Bengali": "দয়া করে কাউন্টার নম্বরটি লিখে দিন (Doya kore counter number-ti likhe din)",
            "Telugu": "దయచేసి కౌంటర్ సంఖ్యను రాసి ఇవ్వండి (Dayachesi counter sankhyanu raasi ivvandi)",
            "Kannada": "ದಯವಿಟ್ಟು ಕೌಂಟರ್ ಸಂಖ್ಯೆಯನ್ನು ಬರೆದು ಕೊಡಿ (Dayavittu counter sankhyeyannu baredu kodi)",
        },

        "I am deaf": {
            "Hindi": "मैं सुन नहीं सकता/सकती (Main sun nahi sakta/sakti)",
            "Marathi": "मला ऐकू येत नाही (Mala aiku yet nahi)",
            "Tamil": "எனக்கு காது கேளாது (Enakku kaathu kelathu)",
            "Bengali": "আমি শুনতে পাই না (Ami shunte pai na)",
            "Telugu": "నాకు వినిపించదు (Naaku vinipinchadu)",
            "Kannada": "ನನಗೆ ಕೇಳಿಸುವುದಿಲ್ಲ (Nanage kelisuvudilla)",
        },
    }

    # =========================================================
    # ALL SUPPORTED INDIAN LANGUAGES
    # =========================================================

    LANG_CODE_MAP = {
        "en": "English",
        "english": "English",

        "as": "Assamese",
        "assamese": "Assamese",

        "bn": "Bengali",
        "bengali": "Bengali",

        "brx": "Bodo",
        "bodo": "Bodo",

        "doi": "Dogri",
        "dogri": "Dogri",

        "gu": "Gujarati",
        "gujarati": "Gujarati",

        "hi": "Hindi",
        "hindi": "Hindi",

        "kn": "Kannada",
        "kannada": "Kannada",

        "ks": "Kashmiri",
        "kashmiri": "Kashmiri",

        "kok": "Konkani",
        "konkani": "Konkani",

        "mai": "Maithili",
        "maithili": "Maithili",

        "ml": "Malayalam",
        "malayalam": "Malayalam",

        "mni": "Manipuri",
        "manipuri": "Manipuri",
        "meitei": "Manipuri",

        "mr": "Marathi",
        "marathi": "Marathi",

        "ne": "Nepali",
        "nepali": "Nepali",

        "or": "Odia",
        "odia": "Odia",
        "oriya": "Odia",

        "pa": "Punjabi",
        "punjabi": "Punjabi",

        "sa": "Sanskrit",
        "sanskrit": "Sanskrit",

        "sat": "Santali",
        "santali": "Santali",

        "sd": "Sindhi",
        "sindhi": "Sindhi",

        "ta": "Tamil",
        "tamil": "Tamil",

        "te": "Telugu",
        "telugu": "Telugu",

        "ur": "Urdu",
        "urdu": "Urdu",
    }

    LANG_NAME_TO_CODE = {
        "English": "en",
        "Assamese": "as",
        "Bengali": "bn",
        "Bodo": "brx",
        "Dogri": "doi",
        "Gujarati": "gu",
        "Hindi": "hi",
        "Kannada": "kn",
        "Kashmiri": "ks",
        "Konkani": "kok",
        "Maithili": "mai",
        "Malayalam": "ml",
        "Manipuri": "mni",
        "Marathi": "mr",
        "Nepali": "ne",
        "Odia": "or",
        "Punjabi": "pa",
        "Sanskrit": "sa",
        "Santali": "sat",
        "Sindhi": "sd",
        "Tamil": "ta",
        "Telugu": "te",
        "Urdu": "ur",
    }

    # =========================================================
    # LANGUAGE DISPLAY NAMES
    # =========================================================

    LANGUAGE_DISPLAY_NAMES = {
        "English": "English",
        "Assamese": "অসমীয়া",
        "Bengali": "বাংলা",
        "Bodo": "बड़ो",
        "Dogri": "डोगरी",
        "Gujarati": "ગુજરાતી",
        "Hindi": "हिंदी",
        "Kannada": "ಕನ್ನಡ",
        "Kashmiri": "کٲشُر",
        "Konkani": "कोंकणी",
        "Maithili": "मैथिली",
        "Malayalam": "മലയാളം",
        "Manipuri": "মৈতৈলোন্",
        "Marathi": "मराठी",
        "Nepali": "नेपाली",
        "Odia": "ଓଡ଼ିଆ",
        "Punjabi": "ਪੰਜਾਬੀ",
        "Sanskrit": "संस्कृतम्",
        "Santali": "ᱥᱟᱱᱛᱟᱲᱤ",
        "Sindhi": "سنڌي",
        "Tamil": "தமிழ்",
        "Telugu": "తెలుగు",
        "Urdu": "اردو",
    }

    # =========================================================
    # READING-LEVEL OFFLINE SUBSTITUTIONS
    # =========================================================

    SIMPLIFIED_SUBSTITUTIONS = [
        (r"\bsubsequently\b", "then"),
        (r"\butilize\b", "use"),
        (r"\bmandatory\b", "required"),
        (r"\bcommence\b", "start"),
        (r"\bterminate\b", "end"),
        (r"\bfurnish\b", "provide"),
        (r"\bexpedite\b", "speed up"),
        (r"\bin the event that\b", "if"),
        (r"\bprior to\b", "before"),
        (r"\bin accordance with\b", "following"),
        (r"\brequisition\b", "request"),
        (r"\bapproximately\b", "about"),
        (r"\badditional\b", "more"),
        (r"\bassist\b", "help"),
        (r"\bobtain\b", "get"),
        (r"\brequire\b", "need"),
        (r"\brequired\b", "needed"),
    ]

    # =========================================================
    # LANGUAGE HELPERS
    # =========================================================

    @classmethod
    def resolve_language(cls, language: str) -> str:
        if not language:
            return "Hindi"

        normalized = str(language).strip().lower()

        return cls.LANG_CODE_MAP.get(
            normalized,
            str(language).strip()
        )

    @classmethod
    def get_language_code(cls, language: str) -> str:
        resolved = cls.resolve_language(language)

        return cls.LANG_NAME_TO_CODE.get(
            resolved,
            str(language).strip().lower()
        )

    @classmethod
    def is_supported_language(cls, language: str) -> bool:
        if not language:
            return False

        normalized = str(language).strip().lower()

        return normalized in cls.LANG_CODE_MAP

    # =========================================================
    # TRANSLATION
    # =========================================================

    async def translate(
        self,
        text: str,
        target_language: str = "Hindi",
        mode: str = "curated_or_ai"
    ) -> Dict[str, Any]:

        clean_text = text.strip()

        if not clean_text:
            return {
                "original_text": "",
                "translated_text": "",
                "target_language": self.resolve_language(target_language),
                "pronunciation_guide": None,
                "engine": "validation_error",
                "provenance": "Validation",
                "is_ai": False,
                "live_inference_blocked": True,
                "error": "Text cannot be empty for translation."
            }

        resolved_lang = self.resolve_language(target_language)
        language_code = self.get_language_code(target_language)

        if not self.is_supported_language(target_language):
            return {
                "original_text": clean_text,
                "translated_text": clean_text,
                "target_language": resolved_lang,
                "target_language_code": language_code,
                "pronunciation_guide": None,
                "engine": "unsupported_language",
                "provenance": "Language Validation",
                "is_ai": False,
                "live_inference_blocked": True,
                "error": (
                    f"Unsupported target language: {target_language}. "
                    f"Please select one of SignMitra's supported languages."
                )
            }

        if language_code == "en" and clean_text:
            return {
                "original_text": clean_text,
                "translated_text": clean_text,
                "target_language": "English",
                "target_language_code": "en",
                "pronunciation_guide": None,
                "engine": "identity",
                "provenance": "No Translation Required",
                "is_ai": False,
                "live_inference_blocked": False
            }

        if mode != "ai":

            for phrase, lang_map in self.CORE_DICTIONARY.items():

                if phrase.lower() in clean_text.lower():

                    trans = lang_map.get(resolved_lang)

                    if trans and clean_text.lower() == phrase.lower():

                        pronunciation = None

                        if "(" in trans and ")" in trans:
                            pronunciation = (
                                trans.split("(")[-1]
                                .replace(")", "")
                                .strip()
                            )

                        return {
                            "original_text": clean_text,
                            "translated_text": trans,
                            "target_language": resolved_lang,
                            "target_language_code": language_code,
                            "pronunciation_guide": pronunciation,
                            "engine": "curated_dictionary",
                            "provenance": "Curated Institutional Phrasebook",
                            "is_ai": False,
                            "live_inference_blocked": False
                        }

        if gemini_service.is_configured():

            if resolved_lang == "English":

                script_instruction = (
                    "Return the translation in natural English. "
                    "Do not add transliteration."
                )

            else:

                display_name = self.LANGUAGE_DISPLAY_NAMES.get(
                    resolved_lang,
                    resolved_lang
                )

                script_instruction = (
                    f"Write the translation using the standard written "
                    f"script used for {resolved_lang} "
                    f"({display_name}). "
                    f"Also provide a simple English phonetic transliteration "
                    f"in the pronunciation_guide field."
                )

            prompt = f"""
You are SignMitra's multilingual communication assistant.

Your job is to translate a message for communication between
a Deaf or Hard-of-Hearing user and hearing staff in India.

TARGET LANGUAGE:
{resolved_lang}

TARGET LANGUAGE CODE:
{language_code}

TRANSLATION REQUIREMENTS:
1. Translate naturally and accurately into {resolved_lang}.
2. Preserve the original meaning.
3. Use polite, respectful and practical language.
4. Do NOT add information that is not present in the original.
5. Do NOT remove important information.
6. Preserve all numbers exactly.
7. Preserve dates exactly unless normal grammatical formatting is required.
8. Preserve times exactly.
9. Preserve counter numbers exactly.
10. Preserve student IDs, application numbers, receipt numbers and reference numbers.
11. Preserve names of people, institutions and places.
12. Preserve locations and building/counter names.
13. Do not convert a number into words unless absolutely required by the target language.
14. Do not invent a deadline, location, document, requirement or instruction.
15. The result should sound like something a real person would say to staff.

{script_instruction}

SOURCE TEXT:
"{clean_text}"

Return ONLY valid JSON in exactly this structure:

{{
    "translated_text": "...",
    "pronunciation_guide": "..."
}}
"""

            try:

                res = await gemini_service.generate_structured_json(prompt)

                provider_name = gemini_service.provider.provider_name

                translated_text = (
                    res.get("translated_text")
                    or clean_text
                )

                pronunciation_guide = (
                    res.get("pronunciation_guide")
                )

                return {
                    "original_text": clean_text,
                    "translated_text": translated_text,
                    "target_language": resolved_lang,
                    "target_language_code": language_code,
                    "pronunciation_guide": pronunciation_guide,
                    "engine": f"{provider_name}_llm",
                    "provenance": (
                        f"Live Model Generated ({provider_name})"
                    ),
                    "is_ai": True,
                    "live_inference_blocked": False
                }

            except Exception as e:

                return {
                    "original_text": clean_text,
                    "translated_text": clean_text,
                    "target_language": resolved_lang,
                    "target_language_code": language_code,
                    "pronunciation_guide": None,
                    "engine": "provider_error",
                    "error": f"Live translation failed: {str(e)}",
                    "provenance": "Translation Failed",
                    "is_ai": True,
                    "live_inference_blocked": True
                }

        return {
            "original_text": clean_text,
            "translated_text": (
                f"[Translation to {resolved_lang} requires "
                f"an AI Provider Key in .env] {clean_text}"
            ),
            "target_language": resolved_lang,
            "target_language_code": language_code,
            "pronunciation_guide": None,
            "engine": "unconfigured_fallback",
            "provenance": "Provider Unconfigured (Key Required)",
            "is_ai": True,
            "live_inference_blocked": True,
            "error": (
                "Live AI translation is blocked: "
                "No active AI provider key configured in .env."
            )
        }

    # =========================================================
    # LANGUAGE DETECTION
    # =========================================================

    async def detect_language(
        self,
        text: str
    ) -> Dict[str, Any]:

        clean_text = text.strip()

        if not clean_text:
            return {
                "detected": False,
                "engine": "validation_error",
                "provenance": "Validation",
                "error": (
                    "Text cannot be empty for language detection."
                )
            }

        if gemini_service.is_configured():

            prompt = f"""
You are SignMitra's language detection assistant.

Identify the language of the following text.

TEXT:
"{clean_text}"

Return ONLY valid JSON:

{{
    "language_name": "...",
    "language_code": "...",
    "confidence": 0.95
}}

The language_code should use SignMitra's supported codes where possible.
"""

            try:

                res = await gemini_service.generate_structured_json(
                    prompt
                )

                provider_name = gemini_service.provider.provider_name

                detected_name = res.get(
                    "language_name",
                    "English"
                )

                detected_code = self.get_language_code(
                    res.get("language_code", detected_name)
                )

                return {
                    "detected": True,
                    "language_name": detected_name,
                    "language_code": detected_code,
                    "confidence": float(
                        res.get("confidence", 0.95)
                    ),
                    "engine": f"{provider_name}_llm",
                    "provenance": (
                        f"Live Model Detection ({provider_name})"
                    ),
                    "live_inference_blocked": False
                }

            except Exception as e:

                return {
                    "detected": False,
                    "engine": "provider_error",
                    "provenance": "Live Provider Error",
                    "live_inference_blocked": True,
                    "error": (
                        f"Language detection call failed: {str(e)}"
                    )
                }

        return {
            "detected": False,
            "engine": "unconfigured_fallback",
            "provenance": "Provider Unconfigured",
            "live_inference_blocked": True,
            "error": (
                "Language auto-detection is currently unavailable: "
                "No active AI provider key is configured in your "
                "environment. Please select the source language manually."
            )
        }

    # =========================================================
    # READING LEVEL SIMPLIFICATION
    # =========================================================

    async def simplify_reading_level(
        self,
        text: str,
        target_level: str = "grade5"
    ) -> Dict[str, Any]:
        """
        Transform institutional text according to a specific
        accessibility mode while preserving critical facts.

        Supported modes:
        - simpler
        - shorter
        - step_by_step
        - key_points
        - formal

        The AI path is provider-independent through gemini_service.
        A deterministic rule-based fallback is used when AI is
        unavailable or when the generated result fails validation.
        """

        clean_text = text.strip()

        if not clean_text:
            return {
                "original_text": "",
                "simplified_text": "",
                "reading_level": target_level,
                "key_points": [],
                "engine": "validation_error",
                "provenance": "Validation",
                "is_ai": False,
                "live_inference_blocked": True,
                "error": "Text cannot be empty."
            }

        # -----------------------------------------------------
        # NORMALIZE MODE
        # -----------------------------------------------------

        mode_aliases = {
            "grade3": "simpler",
            "grade5": "simpler",
            "grade8": "simpler",
            "simpler": "simpler",
            "shorter": "shorter",
            "step_by_step": "step_by_step",
            "steps": "step_by_step",
            "key_points": "key_points",
            "bullet_points": "key_points",
            "formal": "formal",
            "executive": "key_points",
        }

        mode = mode_aliases.get(
            str(target_level).strip().lower(),
            "simpler"
        )

        # -----------------------------------------------------
        # EXTRACT CRITICAL FACTS
        # -----------------------------------------------------

        def extract_critical_facts(source: str):
            """
            Extract high-risk factual tokens that should survive
            accessibility transformation.
            """

            facts = []

            # Numbers.
            facts.extend(
                re.findall(
                    r"\b\d+(?:[.,]\d+)*\b",
                    source
                )
            )

            # Times such as 2:30 PM / 14:30.
            facts.extend(
                re.findall(
                    r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b",
                    source
                )
            )

            facts.extend(
                re.findall(
                    r"\b\d{1,2}\s*(?:AM|PM|am|pm)\b",
                    source,
                    flags=re.IGNORECASE
                )
            )

            # Numeric dates.
            facts.extend(
                re.findall(
                    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
                    source
                )
            )

            # Weekdays and months.
            facts.extend(
                re.findall(
                    r"\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|"
                    r"Saturday|Sunday|January|February|March|April|May|"
                    r"June|July|August|September|October|November|December)\b",
                    source,
                    flags=re.IGNORECASE
                )
            )

            # Acronyms / identifiers.
            facts.extend(
                re.findall(
                    r"\b[A-Z]{2,}\b",
                    source
                )
            )

            # Capitalized multi-word institutional/location names.
            capitalized_phrases = re.findall(
                r"\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b",
                source
            )

            facts.extend(capitalized_phrases)

            # Deduplicate.
            unique = []
            seen = set()

            for fact in facts:

                fact = fact.strip()

                if not fact:
                    continue

                normalized_fact = fact.lower()

                if normalized_fact not in seen:
                    seen.add(normalized_fact)
                    unique.append(fact)

            return unique

        critical_facts = extract_critical_facts(clean_text)

        # -----------------------------------------------------
        # FACT PRESERVATION VALIDATION
        # -----------------------------------------------------

        def facts_are_preserved(transformed: str) -> bool:

            if not transformed or not transformed.strip():
                return False

            transformed_lower = transformed.lower()

            for fact in critical_facts:

                if fact.lower() not in transformed_lower:
                    return False

            return True

        # -----------------------------------------------------
        # MODE-SPECIFIC AI INSTRUCTIONS
        # -----------------------------------------------------

        mode_instructions = {

            "simpler": """
MODE: SIMPLER WORDING

Rewrite the source using easier everyday English.

PRIMARY GOAL:
Make vocabulary easier to understand.

Rules:
- Replace difficult, formal or administrative words with simpler words.
- Keep important information.
- Keep the original level of detail.
- Do not summarize.
- Do not remove actions or requirements.
- Do not add explanations.
- If the original wording is already simple, make only necessary changes.
""",

            "shorter": """
MODE: SHORTER SENTENCES

Rewrite the source using shorter, clearer sentences.

PRIMARY GOAL:
Reduce sentence complexity, NOT factual content.

Rules:
- Split long sentences into shorter sentences.
- Remove unnecessary filler or repetition.
- Keep every important action.
- Keep every important factual detail.
- Do not summarize away information.
- Do not remove dates, times, numbers, locations, names,
  documents, deadlines or requirements.
""",

            "step_by_step": """
MODE: STEP-BY-STEP

Convert the source into a clear ordered sequence of actions.

PRIMARY GOAL:
Make the required actions easy to follow one at a time.

Rules:
- Use numbered steps beginning with 1., 2., 3., etc.
- Keep the original order of actions.
- Prefer one clear action per step.
- If a deadline belongs to an action, keep it with that action
  or make the deadline its own step.
- Preserve every date, time, number, location, document and requirement.
- Do not invent additional actions.
""",

            "key_points": """
MODE: KEY POINTS ONLY

Convert the source into concise bullet points.

PRIMARY GOAL:
Make the essential actions and facts immediately visible.

Rules:
- Use bullet points beginning with •.
- Include the essential actions and important constraints.
- Preserve deadlines, dates, times, numbers, locations, names,
  documents and requirements.
- Remove only unnecessary wording.
- Do not make the result vague.
- Do not invent missing information.
- Do not turn an important instruction into a generic summary.
""",

            "formal": """
MODE: FORMAL / POLITE

Rewrite the source in clear, professional and respectful English.

PRIMARY GOAL:
Improve tone without changing content.

Rules:
- Use polite professional wording.
- Preserve the original meaning and level of detail.
- You may use wording such as "Please" or "Kindly" where appropriate.
- DO NOT invent a recipient, title or greeting.
- DO NOT add "Sir", "Madam", "Sir/Madam", "Respected", or similar
  unless it already appears in the source.
- DO NOT add "Please note" unless it is necessary and does not
  introduce a new meaning.
- Do not add facts, instructions or requirements.
- Preserve all dates, times, numbers, names, locations and documents.
"""
        }

        selected_mode_instruction = mode_instructions[mode]

        # -----------------------------------------------------
        # AI SYSTEM INSTRUCTION
        # -----------------------------------------------------

        system_instruction = """
You are SignMitra's Plain Language and Cognitive Accessibility
transformation engine.

Transform the supplied text for accessibility without changing
its factual meaning.

This output may be used for real-world institutional communication.
Changing a deadline, location, number, document, name or instruction
can cause harm.

NON-NEGOTIABLE SAFETY RULES:

1. Never invent information.
2. Never remove a critical factual detail.
3. Never change a number.
4. Never change a time.
5. Never change a date.
6. Never change a weekday.
7. Never change a location.
8. Never change a person's name.
9. Never change an institution's name.
10. Never change a counter number.
11. Never change an ID, application number or reference number.
12. Never invent a document or requirement.
13. Never invent a recipient or greeting.
14. Never add "Sir", "Madam", "Sir/Madam", "Respected Sir/Madam",
    or similar wording unless present in the source.
15. Never change the order of actions in step-by-step mode.
16. Do not summarize unless key_points mode is explicitly requested.
17. Follow only the requested accessibility mode.
18. Do not perform unrelated transformations.
19. Return valid JSON only.
"""

        # -----------------------------------------------------
        # REAL AI TRANSFORMATION
        # -----------------------------------------------------

        if gemini_service.is_configured():

            prompt = f"""
Transform the following source text using the requested
accessibility mode.

REQUESTED MODE:
{mode}

MODE INSTRUCTIONS:
{selected_mode_instruction}

CRITICAL FACTS THAT MUST REMAIN PRESENT:
{critical_facts}

SOURCE TEXT:
"{clean_text}"

OUTPUT REQUIREMENTS:

Return ONLY valid JSON in exactly this structure:

{{
    "simplified_text": "...",
    "key_points": [
        "point 1",
        "point 2"
    ]
}}

Requirements:

- simplified_text must contain the actual mode-specific transformation.
- key_points must contain 2-4 useful points derived ONLY from the source.
- For step_by_step mode, simplified_text MUST use numbered steps.
- For key_points mode, simplified_text MUST use bullet points.
- For simpler mode, prioritize easier vocabulary.
- For shorter mode, prioritize shorter sentences.
- For formal mode, prioritize professional and polite wording WITHOUT
  inventing a greeting or recipient.
- Do not output markdown code fences.
- Do not output commentary outside the JSON.
"""

            try:

                res = await gemini_service.generate_structured_json(
                    prompt,
                    system_instruction
                )

                generated_text = str(
                    res.get("simplified_text") or ""
                ).strip()

                generated_key_points = res.get(
                    "key_points",
                    []
                )

                if not isinstance(
                    generated_key_points,
                    list
                ):
                    generated_key_points = []

                generated_key_points = [
                    str(point).strip()
                    for point in generated_key_points
                    if str(point).strip()
                ][:4]

                # -------------------------------------------------
                # STRUCTURAL VALIDATION
                # -------------------------------------------------

                structure_valid = True

                if mode == "step_by_step":

                    structure_valid = bool(
                        re.search(
                            r"(?:^|\n)\s*(?:\d+[\.\)]|Step\s+\d+)",
                            generated_text,
                            flags=re.IGNORECASE
                        )
                    )

                elif mode == "key_points":

                    structure_valid = bool(
                        re.search(
                            r"(?:^|\n)\s*(?:[-*•]|\d+[\.\)])",
                            generated_text
                        )
                    )

                # -------------------------------------------------
                # MODE-SPECIFIC SAFETY CHECKS
                # -------------------------------------------------

                unwanted_formal_additions = False

                if mode == "formal":

                    forbidden_additions = [
                        "sir/madam",
                        "sir / madam",
                        "sir",
                        "madam",
                        "respected sir",
                        "respected madam",
                        "respected sir/madam",
                    ]

                    generated_lower = generated_text.lower()

                    unwanted_formal_additions = any(
                        phrase in generated_lower
                        and phrase not in clean_text.lower()
                        for phrase in forbidden_additions
                    )

                # -------------------------------------------------
                # FACT PRESERVATION GATE
                # -------------------------------------------------

                facts_valid = facts_are_preserved(
                    generated_text
                )

                if (
                    generated_text
                    and facts_valid
                    and structure_valid
                    and not unwanted_formal_additions
                ):

                    provider_name = (
                        gemini_service.provider.provider_name
                    )

                    return {
                        "original_text": clean_text,
                        "simplified_text": generated_text,
                        "reading_level": mode,
                        "key_points": generated_key_points,
                        "engine": f"{provider_name}_llm",
                        "provenance": (
                            f"Live Mode-Specific Simplification "
                            f"({provider_name})"
                        ),
                        "is_ai": True,
                        "live_inference_blocked": False
                    }

            except Exception:
                # Safe fall-through to deterministic transformation.
                pass

        # =========================================================
        # SAFE OFFLINE FALLBACK
        # =========================================================

        simplified = clean_text

        # Basic vocabulary simplification.
        for pattern, replacement in self.SIMPLIFIED_SUBSTITUTIONS:

            simplified = re.sub(
                pattern,
                replacement,
                simplified,
                flags=re.IGNORECASE
            )

        # Split sentences while preserving punctuation.
        sentences = [
            s.strip()
            for s in re.split(
                r"(?<=[.!?])\s+",
                simplified
            )
            if len(s.strip()) > 3
        ]

        if not sentences and simplified:
            sentences = [simplified]

        # -----------------------------------------------------
        # SIMPLER
        # -----------------------------------------------------

        if mode == "simpler":

            formatted_text = " ".join(
                sentences
            ).strip()

        # -----------------------------------------------------
        # SHORTER
        # -----------------------------------------------------

        elif mode == "shorter":

            shorter_sentences = []

            for sentence in sentences:

                parts = re.split(
                    r"\s+(?=(?:and|then|also|but|so)\s+)",
                    sentence,
                    flags=re.IGNORECASE
                )

                shorter_sentences.extend(
                    part.strip()
                    for part in parts
                    if part.strip()
                )

            formatted_text = " ".join(
                shorter_sentences
            ).strip()

        # -----------------------------------------------------
        # STEP BY STEP
        # -----------------------------------------------------

        elif mode == "step_by_step":

            formatted_text = "\n".join(
                f"{index + 1}. {sentence}"
                for index, sentence in enumerate(sentences)
            )

        # -----------------------------------------------------
        # KEY POINTS
        # -----------------------------------------------------

        elif mode == "key_points":

            formatted_text = "\n".join(
                f"• {sentence}"
                for sentence in sentences
            )

        # -----------------------------------------------------
        # FORMAL
        # -----------------------------------------------------

        elif mode == "formal":

            if sentences:

                first_sentence = sentences[0]

                if not re.match(
                    r"^(please|kindly)\b",
                    first_sentence,
                    flags=re.IGNORECASE
                ):
                    first_sentence = (
                        f"Please {first_sentence[0].lower()}"
                        f"{first_sentence[1:]}"
                        if first_sentence
                        else first_sentence
                    )

                remaining = sentences[1:]

                if remaining:

                    formal_sentences = [
                        first_sentence
                    ] + [
                        (
                            sentence
                            if re.match(
                                r"^(please|kindly)\b",
                                sentence,
                                flags=re.IGNORECASE
                            )
                            else f"Kindly {sentence[0].lower()}{sentence[1:]}"
                        )
                        for sentence in remaining
                    ]

                    formatted_text = " ".join(
                        formal_sentences
                    )

                else:

                    formatted_text = first_sentence

            else:

                formatted_text = clean_text

        else:

            formatted_text = " ".join(
                sentences
            )

        # -----------------------------------------------------
        # FINAL FALLBACK SAFETY CHECK
        # -----------------------------------------------------

        if not facts_are_preserved(
            formatted_text
        ):
            formatted_text = clean_text

        return {
            "original_text": clean_text,
            "simplified_text": formatted_text,
            "reading_level": mode,
            "key_points": sentences[:4],
            "engine": "rule_based_simplifier",
            "provenance": "Rule-Based Offline Simplification",
            "is_ai": False,
            "live_inference_blocked": False
        }


translation_service = TranslationService()