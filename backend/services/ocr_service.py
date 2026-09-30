import base64
import io
import re
from typing import Dict, Any, Tuple
from PIL import Image

from backend.services.ai_service import gemini_service

class OCRService:
    MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 # 5 MB
    MIN_DIMENSION = 50

    def validate_and_decode_base64_image(self, b64_string: str) -> Tuple[bytes, str, Image.Image]:
        """
        Validates, decodes, and inspects image data using Pillow.
        Returns (raw_bytes, mime_type, PIL.Image object).
        """
        if not b64_string or not isinstance(b64_string, str):
            raise ValueError("Image data must be a non-empty string.")

        # Strip data URL prefix if present
        mime_type = "image/jpeg"
        if "," in b64_string:
            header, encoded = b64_string.split(",", 1)
            if "image/png" in header:
                mime_type = "image/png"
            elif "image/webp" in header:
                mime_type = "image/webp"
            b64_data = encoded
        else:
            b64_data = b64_string

        try:
            image_bytes = base64.b64decode(b64_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 payload: {str(e)}")

        if len(image_bytes) == 0:
            raise ValueError("Decoded image data is empty.")

        if len(image_bytes) > self.MAX_IMAGE_SIZE_BYTES:
            raise ValueError(f"Image size exceeds maximum limit of {self.MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB.")

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify() # Verify file integrity
            # Reopen after verify because verify closes image
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Corrupted or unsupported image file: {str(e)}")

        if image.width < self.MIN_DIMENSION or image.height < self.MIN_DIMENSION:
            raise ValueError(f"Image dimensions ({image.width}x{image.height}) are too small for OCR analysis.")

        return image_bytes, mime_type, image

    async def analyze_image(self, b64_string: str, mode: str = "notice") -> Dict[str, Any]:
        """
        Processes an image. If Gemini is available, uses vision AI.
        Otherwise uses deterministic image analysis with honest fallback disclosure.
        """
        image_bytes, mime_type, image = self.validate_and_decode_base64_image(b64_string)

        if gemini_service.is_configured():
            prompt = (
                f"You are SignMitra's institutional document and notice OCR reader for Deaf users in India.\n"
                f"Analyze this image in mode '{mode}'.\n"
                f"Extract all readable text accurately. Do not invent any text not visible in the image.\n"
                f"Identify structured fields (e.g., token_number, counter_number, department, deadlines, instructions).\n"
                f"Return a JSON object with keys:\n"
                f"- extracted_text: string\n"
                f"- detected_type: string (e.g. 'token_slip', 'office_notice', 'application_form')\n"
                f"- structured_fields: object containing any detected tokens, counters, dates\n"
                f"- confidence_note: string stating readability and clarity"
            )
            try:
                ai_result = await gemini_service.analyze_image_with_vision(image_bytes, mime_type, prompt)
                return {
                    "extracted_text": ai_result.get("extracted_text", ""),
                    "detected_type": ai_result.get("detected_type", mode),
                    "structured_fields": ai_result.get("structured_fields", {}),
                    "confidence_note": ai_result.get("confidence_note", f"Analyzed using {gemini_service.provider.provider_name} Vision API"),
                    "is_interpreted_by_ai": True,
                    "engine": f"{gemini_service.provider.provider_name}_vision"
                }
            except Exception as e:
                # If vision fails, provide clear error message
                raise RuntimeError(f"Live Vision analysis ({gemini_service.provider.provider_name}) failed: {str(e)}")

        # Fallback when no Vision AI provider is configured:
        # Honest disclosure: we cannot invent text from an arbitrary image without an OCR engine/model.
        return {
            "extracted_text": f"[Image uploaded successfully: {image.format} {image.width}x{image.height}px]\n"
                              f"Note: Optical character recognition requires a vision provider key (GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY) in backend/.env.",
            "detected_type": mode,
            "structured_fields": {
                "dimensions": f"{image.width}x{image.height}",
                "format": image.format,
                "status": "Vision Provider Unconfigured"
            },
            "confidence_note": "Image passed Pillow validation. To enable full character reading, provide a Vision API key in backend/.env.",
            "is_interpreted_by_ai": False,
            "engine": "image_validator_offline"
        }

ocr_service = OCRService()
