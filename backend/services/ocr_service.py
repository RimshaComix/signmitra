import base64
import io
from typing import Dict, Any, Tuple

from PIL import Image

from backend.services.ai_provider import get_ai_provider


class OCRService:
    MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
    MIN_DIMENSION = 50

    def validate_and_decode_base64_image(
        self,
        b64_string: str
    ) -> Tuple[bytes, str, Image.Image]:
        """
        Validate, decode, and inspect the uploaded image.
        Returns: (raw_bytes, mime_type, PIL.Image)
        """
        if not b64_string or not isinstance(b64_string, str):
            raise ValueError("Image data must be a non-empty string.")

        mime_type = "image/jpeg"

        if "," in b64_string:
            header, encoded = b64_string.split(",", 1)

            if "image/png" in header:
                mime_type = "image/png"
            elif "image/webp" in header:
                mime_type = "image/webp"
            elif "image/jpeg" in header or "image/jpg" in header:
                mime_type = "image/jpeg"

            b64_data = encoded
        else:
            b64_data = b64_string

        try:
            image_bytes = base64.b64decode(b64_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 payload: {str(e)}")

        if not image_bytes:
            raise ValueError("Decoded image data is empty.")

        if len(image_bytes) > self.MAX_IMAGE_SIZE_BYTES:
            raise ValueError(
                f"Image size exceeds maximum limit of "
                f"{self.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB."
            )

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()

            image = Image.open(io.BytesIO(image_bytes))

        except Exception as e:
            raise ValueError(
                f"Corrupted or unsupported image file: {str(e)}"
            )

        if (
            image.width < self.MIN_DIMENSION
            or image.height < self.MIN_DIMENSION
        ):
            raise ValueError(
                f"Image dimensions ({image.width}x{image.height}) "
                f"are too small for OCR analysis."
            )

        return image_bytes, mime_type, image

    async def analyze_image(
        self,
        b64_string: str,
        mode: str = "notice"
    ) -> Dict[str, Any]:
        """
        Analyze any uploaded document, receipt, bill, ticket,
        notice, form, or general image using the live vision provider.
        """

        image_bytes, mime_type, image = (
            self.validate_and_decode_base64_image(b64_string)
        )

        provider = get_ai_provider()

        if not provider.is_configured():
            return {
                "extracted_text": "",
                "detected_type": mode,
                "structured_fields": {},
                "confidence_note": "Live vision provider is not configured.",
                "is_interpreted_by_ai": False,
                "engine": "vision_unavailable",
                "provenance": "vision-unavailable",
                "live_inference_blocked": True,
                "has_readable_text": False,
                "disclaimer": (
                    "Live image analysis is unavailable. "
                    "No information was generated."
                ),
            }

        # Keep this prompt compact because Groq vision has a strict
        # input/output token limit on the current on-demand tier.
        prompt = f"""
You are SignMitra's general-purpose visual document reader.

Analyze this image in mode "{mode}".

The image may contain ANY visible document or printed information:
restaurant bill, hospital bill, receipt, invoice, ticket, token slip,
notice, form, pharmacy bill, retail receipt, utility bill, menu,
appointment slip, or another document.

Rules:
- Extract only text/data actually visible.
- Never guess or invent missing information.
- Use "Not visible" for missing scalar fields.
- Use [] for missing lists.
- Preserve numbers, dates, times and amounts exactly.
- Do not infer sensitive personal attributes.
- Return JSON only.
- Keep the response concise.

Return:

{{
  "extracted_text": "Readable text in natural order",
  "detected_type": "Best document type",
  "structured_fields": {{
    "business_or_organization": "Not visible",
    "document_number": "Not visible",
    "order_number": "Not visible",
    "token_number": "Not visible",
    "counter_number": "Not visible",
    "department": "Not visible",
    "table_number": "Not visible",
    "cashier": "Not visible",
    "service_type": "Not visible",
    "dates": [],
    "times": [],
    "currency": "Not visible",
    "subtotal": "Not visible",
    "tax": "Not visible",
    "discount": "Not visible",
    "total_amount": "Not visible",
    "payment_method": "Not visible",
    "location": "Not visible",
    "items": [],
    "instructions": [],
    "other_relevant_fields": {{}}
  }},
  "confidence_note": "Brief note about readability",
  "image_description": "Short factual description"
}}

For each visible item, use:
{{"name": "...", "quantity": "...", "amount": "..."}}

Only include information supported by the image.
"""

        try:
            ai_result = await provider.analyze_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                prompt=prompt,
            )

        except Exception as e:
            provider_name = getattr(
                provider,
                "provider_name",
                provider.__class__.__name__,
            )

            raise RuntimeError(
                f"Live Vision analysis ({provider_name}) failed: {str(e)}"
            )

        if not isinstance(ai_result, dict):
            raise RuntimeError(
                "Vision provider returned an invalid response."
            )

        provider_name = getattr(
            provider,
            "provider_name",
            "unknown",
        )

        extracted_text = ai_result.get(
            "extracted_text",
            ""
        )

        structured_fields = ai_result.get(
            "structured_fields",
            {}
        )

        if not isinstance(structured_fields, dict):
            structured_fields = {}

        image_description = ai_result.get(
            "image_description",
            ""
        )

        return {
            "extracted_text": extracted_text,
            "detected_type": ai_result.get(
                "detected_type",
                mode
            ),
            "structured_fields": structured_fields,
            "confidence_note": ai_result.get(
                "confidence_note",
                f"Analyzed using {provider_name} Vision."
            ),
            "is_interpreted_by_ai": True,
            "engine": f"{provider_name}_vision",
            "provenance": f"{provider_name}_vision",
            "live_inference_blocked": False,
            "validation_details": {
                "image_format": image.format,
                "width": image.width,
                "height": image.height,
            },
            "has_readable_text": bool(
                isinstance(extracted_text, str)
                and extracted_text.strip()
            ),
            "disclaimer": (
                "Information was extracted from the uploaded image "
                "using live AI vision. Unclear information is not inferred."
            ),
            "image_description": image_description,
        }


ocr_service = OCRService()