import re
from typing import Dict, List, Any
from backend.services.ai_service import gemini_service

class TranslationService:
    # Curated offline translations for foundational communication phrases
    CORE_DICTIONARY = {
        "Please communicate in writing": {
            "Hindi": "कृपया लिखकर बताएं (Kripya likhkar batayein)",
            "Marathi": "कृपया लिहून सांगा (Krupaya lihun sanga)",
            "Tamil": "தயவுசெய்து எழுதித் தெரிவிக்கவும் (Thayavuseithu ezhuthi therivikkavum)",
            "Bengali": "অনুগ্রহ করে লিখে জানান (Anugraha kore likhe janan)",
            "Telugu": "దయచేసి రాసి చెప్పండి (Dayachesi raasi cheppandi)",
            "Kannada": "ದಯವಿಟ್ಟು ಬರೆದು ತಿಳಿಸಿ (Dayavittu baredu thilisi)"
        },
        "Please write down the counter number": {
            "Hindi": "कृपया काउंटर नंबर लिखकर बताएं (Kripya counter number likhkar batayein)",
            "Marathi": "कृपया काउंटर नंबर लिहून द्या (Krupaya counter number lihun dya)",
            "Tamil": "தயவுசெய்து கவுண்டர் எண்ணை எழுதித் தரவும் (Thayavuseithu counter ennai ezhuthi tharavum)",
            "Bengali": "দয়া করে কাউন্টার নম্বরটি লিখে দিন (Doya kore counter number-ti likhe din)",
            "Telugu": "దయచేసి కౌంటర్ సంఖ్యను రాసి ఇవ్వండి (Dayachesi counter sankhyanu raasi ivvandi)",
            "Kannada": "ದಯವಿಟ್ಟು ಕೌಂಟರ್ ಸಂಖ್ಯೆಯನ್ನು ಬರೆದು ಕೊಡಿ (Dayavittu counter sankhyeyannu baredu kodi)"
        },
        "I am deaf": {
            "Hindi": "मैं सुन नहीं सकता/सकती (Main sun nahi sakta/sakti)",
            "Marathi": "मला ऐकू येत नाही (Mala aiku yet nahi)",
            "Tamil": "எனக்கு காது கேளாது (Enakku kaathu kelathu)",
            "Bengali": "আমি শুনতে পাই না (Ami shunte pai na)",
            "Telugu": "నాకు వినిపించదు (Naaku vinipinchadu)",
            "Kannada": "ನನಗೆ ಕೇಳಿಸುವುದಿಲ್ಲ (Nanage kelisuvudilla)"
        }
    }

    SIMPLIFIED_SUBSTITUTIONS = [
        (r'\bsubsequently\b', 'then'),
        (r'\butilize\b', 'use'),
        (r'\bmandatory\b', 'required'),
        (r'\bcommence\b', 'start'),
        (r'\bterminate\b', 'end'),
        (r'\bfurnish\b', 'provide'),
        (r'\bexpedite\b', 'speed up'),
        (r'\bin the event that\b', 'if'),
        (r'\bprior to\b', 'before'),
        (r'\bin accordance with\b', 'following'),
    ]

    LANG_CODE_MAP = {
        "hi": "Hindi",
        "mr": "Marathi",
        "ta": "Tamil",
        "bn": "Bengali",
        "te": "Telugu",
        "kn": "Kannada",
        "en": "English",
        "gu": "Gujarati",
        "ml": "Malayalam",
        "pa": "Punjabi",
        "or": "Odia",
        "hindi": "Hindi",
        "marathi": "Marathi",
        "tamil": "Tamil",
        "bengali": "Bengali",
        "telugu": "Telugu",
        "kannada": "Kannada",
        "english": "English",
        "gujarati": "Gujarati",
        "malayalam": "Malayalam",
        "punjabi": "Punjabi",
        "odia": "Odia"
    }

    async def translate(self, text: str, target_language: str = "Hindi", mode: str = "curated_or_ai") -> Dict[str, Any]:
        """
        Translates text to an Indian language.
        If mode == 'ai', executes REAL configured LLM inference. Does NOT substitute curated phrasebook.
        """
        clean_text = text.strip()
        resolved_lang = self.LANG_CODE_MAP.get(target_language.lower(), target_language)

        if mode != "ai":
            # Check offline curated dictionary
            for phrase, lang_map in self.CORE_DICTIONARY.items():
                if phrase.lower() in clean_text.lower():
                    trans = lang_map.get(resolved_lang)
                    if trans and clean_text.lower() == phrase.lower():
                        return {
                            "original_text": clean_text,
                            "translated_text": trans,
                            "target_language": resolved_lang,
                            "pronunciation_guide": trans.split('(')[-1].replace(')', '') if '(' in trans else None,
                            "engine": "curated_dictionary",
                            "provenance": "Curated Institutional Phrasebook",
                            "is_ai": False,
                            "live_inference_blocked": False
                        }

        if gemini_service.is_configured():
            prompt = (
                f"You are a compassionate translation assistant for Deaf and Hard of Hearing individuals in India.\n"
                f"Translate the following communication text into natural, polite, respectful {resolved_lang}.\n"
                f"Include both the native script and an English phonetic transliteration in parentheses.\n"
                f"Text to translate:\n\"{clean_text}\"\n\n"
                f"Respond with JSON format:\n"
                f'{{"translated_text": "...", "pronunciation_guide": "..."}}'
            )
            try:
                res = await gemini_service.generate_structured_json(prompt)
                provider_name = gemini_service.provider.provider_name
                return {
                    "original_text": clean_text,
                    "translated_text": res.get("translated_text", clean_text),
                    "target_language": resolved_lang,
                    "pronunciation_guide": res.get("pronunciation_guide"),
                    "engine": f"{provider_name}_llm",
                    "provenance": f"Live Model Generated ({provider_name})",
                    "is_ai": True,
                    "live_inference_blocked": False
                }
            except Exception as e:
                return {
                    "original_text": clean_text,
                    "translated_text": clean_text,
                    "target_language": resolved_lang,
                    "pronunciation_guide": None,
                    "engine": "provider_error",
                    "error": f"Live translation failed: {str(e)}",
                    "provenance": "Translation Failed",
                    "is_ai": True,
                    "live_inference_blocked": True
                }

        # Fallback if unconfigured
        return {
            "original_text": clean_text,
            "translated_text": f"[Translation to {resolved_lang} requires an AI Provider Key in .env] {clean_text}",
            "target_language": resolved_lang,
            "pronunciation_guide": None,
            "engine": "unconfigured_fallback",
            "provenance": "Provider Unconfigured (Key Required)",
            "is_ai": True,
            "live_inference_blocked": True,
            "error": "Live AI translation is blocked: No active AI provider key configured in .env."
        }

    async def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detects natural language if provider is configured, otherwise explicitly reports unavailable.
        """
        clean_text = text.strip()
        if not clean_text:
            return {
                "detected": False,
                "engine": "validation_error",
                "provenance": "Validation",
                "error": "Text cannot be empty for language detection."
            }

        if gemini_service.is_configured():
            prompt = (
                f"You are SignMitra Linguistic Assistant.\n"
                f"Identify the language of the following text:\n\"{clean_text}\"\n\n"
                f"Respond with JSON format:\n"
                f'{{"language_name": "...", "language_code": "...", "confidence": 0.95}}'
            )
            try:
                res = await gemini_service.generate_structured_json(prompt)
                provider_name = gemini_service.provider.provider_name
                return {
                    "detected": True,
                    "language_name": res.get("language_name", "English"),
                    "language_code": res.get("language_code", "en"),
                    "confidence": float(res.get("confidence", 0.95)),
                    "engine": f"{provider_name}_llm",
                    "provenance": f"Live Model Detection ({provider_name})",
                    "live_inference_blocked": False
                }
            except Exception as e:
                return {
                    "detected": False,
                    "engine": "provider_error",
                    "provenance": "Live Provider Error",
                    "live_inference_blocked": True,
                    "error": f"Language detection call failed: {str(e)}"
                }

        return {
            "detected": False,
            "engine": "unconfigured_fallback",
            "provenance": "Provider Unconfigured",
            "live_inference_blocked": True,
            "error": "Language auto-detection is currently unavailable: No active AI provider key is configured in your environment. Please select the source language manually."
        }

    async def simplify_reading_level(self, text: str, target_level: str = "grade5") -> Dict[str, Any]:
        """
        Simplifies dense institutional or legal text into plain language.
        """
        clean_text = text.strip()

        if gemini_service.is_configured():
            prompt = (
                f"You are SignMitra's Plain Language Explainer for Deaf users.\n"
                f"Simplify the following text to a {target_level} reading level.\n"
                f"Rules:\n"
                f"1. Use short, direct sentences.\n"
                f"2. Remove complex administrative or legal jargon.\n"
                f"3. Extract 2-4 key action points.\n"
                f"4. Do not invent any deadlines, locations, or requirements not present in the original text.\n"
                f"Original text:\n\"{clean_text}\"\n\n"
                f"Return JSON format:\n"
                f'{{"simplified_text": "...", "key_points": ["point 1", "point 2"]}}'
            )
            try:
                res = await gemini_service.generate_structured_json(prompt)
                provider_name = gemini_service.provider.provider_name
                return {
                    "original_text": clean_text,
                    "simplified_text": res.get("simplified_text", clean_text),
                    "reading_level": target_level,
                    "key_points": res.get("key_points", []),
                    "engine": f"{provider_name}_llm",
                    "provenance": f"Live Model Simplification ({provider_name})",
                    "is_ai": True,
                    "live_inference_blocked": False
                }
            except Exception:
                pass

        # Algorithmic simplification fallback
        simplified = clean_text
        for pattern, replacement in self.SIMPLIFIED_SUBSTITUTIONS:
            simplified = re.sub(pattern, replacement, simplified, flags=re.IGNORECASE)

        sentences = [s.strip() for s in re.split(r'[.!?]+', simplified) if len(s.strip()) > 3]
        shortened = ". ".join(sentences[:3]) + ("." if sentences else "")

        if target_level in ("step_by_step", "executive"):
            formatted_text = "\n".join([f"Step {i+1}: {s}" for i, s in enumerate(sentences)])
        elif target_level in ("key_points", "bullet_points"):
            formatted_text = "\n".join([f"• {s}" for s in sentences])
        elif target_level in ("shorter", "grade3"):
            formatted_text = ". ".join(sentences[:2]) + ("." if sentences else "")
        elif target_level == "formal":
            formatted_text = f"Kindly note: {shortened}"
        else: # simpler, grade5, grade8
            formatted_text = shortened

        return {
            "original_text": clean_text,
            "simplified_text": formatted_text,
            "reading_level": target_level,
            "key_points": [s for s in sentences[:4]],
            "engine": "rule_based_simplifier",
            "provenance": "Rule-Based Offline Simplification",
            "is_ai": False,
            "live_inference_blocked": False
        }

translation_service = TranslationService()

