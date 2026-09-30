import pytest
import base64
import io
from unittest.mock import MagicMock, patch, AsyncMock
from PIL import Image
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.ai_provider import (
    GeminiAdapter,
    AIProviderQuotaExhaustedError,
    AIProviderExecutionError
)
from backend.services.ocr_service import ocr_service

client = TestClient(app)

def generate_sample_image_base64(width=100, height=100):
    img = Image.new('RGB', (width, height), color='white')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

class FakeGenAI429Error(Exception):
    def __init__(self, message="Quota exceeded", code=429, retry_delay="46s", is_daily=True):
        super().__init__(message)
        self.code = code
        self.message = message
        violations = []
        if is_daily:
            violations.append({
                "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_requests",
                "quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                "quotaValue": "20"
            })
        self.details = {
            "error": {
                "code": code,
                "status": "RESOURCE_EXHAUSTED",
                "message": message,
                "details": [
                    {
                        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
                        "violations": violations
                    },
                    {
                        "@type": "type.googleapis.com/google.rpc.RetryInfo",
                        "retryDelay": retry_delay
                    }
                ]
            }
        }

@pytest.mark.asyncio
async def test_gemini_adapter_429_quota_exhausted_raises_custom_error():
    """Verify GeminiAdapter.analyze_image detects 429 quota exhaustion and extracts retry delay without infinite loops."""
    adapter = GeminiAdapter(api_key="test_fake_gemini_key", model="gemini-3.8-flash")
    adapter._client = MagicMock()
    adapter._client.models.generate_content.side_effect = FakeGenAI429Error(
        message="You exceeded your current quota: limit 20. Please retry in 46s.",
        retry_delay="46s",
        is_daily=True
    )

    raw_bytes = b"fake_image_bytes"
    with pytest.raises(AIProviderQuotaExhaustedError) as exc_info:
        await adapter.analyze_image(raw_bytes, "image/png", "Extract text")

    err = exc_info.value
    assert err.retry_delay == 46.0
    assert err.quota_metric == "generativelanguage.googleapis.com/generate_content_free_tier_requests"
    assert "quota exceeded" in str(err).lower()
    assert adapter._client.models.generate_content.call_count == 1  # No loop when daily quota exhausted

@pytest.mark.asyncio
async def test_gemini_adapter_transient_rate_limit_bounded_retry():
    """Verify GeminiAdapter respects retry delay and performs at most 1 bounded retry for small transient delays."""
    adapter = GeminiAdapter(api_key="test_fake_gemini_key", model="gemini-3.8-flash")
    adapter._client = MagicMock()
    # First call fails with transient rate limit (retry 0.01s, not daily), second call succeeds
    mock_resp = MagicMock()
    mock_resp.text = '{"extracted_text": "Counter 4"}'
    adapter._client.models.generate_content.side_effect = [
        FakeGenAI429Error(message="Rate limit exceeded. Please retry in 0.01s", retry_delay="0.01s", is_daily=False),
        mock_resp
    ]

    res = await adapter.analyze_image(b"fake_image_bytes", "image/png", "Extract text")
    assert res == {"extracted_text": "Counter 4"}
    assert adapter._client.models.generate_content.call_count == 2  # Exactly 1 retry

@pytest.mark.asyncio
async def test_ocr_service_handles_429_safely_without_fake_text():
    """Verify ocr_service returns honest quota fallback with empty extracted_text and preserved validation."""
    b64 = generate_sample_image_base64(100, 100)

    with patch("backend.services.ai_service.gemini_service.is_vision_configured", return_value=True), \
         patch("backend.services.ai_service.gemini_service.analyze_image_with_vision", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.side_effect = AIProviderQuotaExhaustedError(
            message="Gemini Vision API quota exceeded. Daily limit reached. Please retry in 46s.",
            retry_delay=46.0,
            quota_metric="free_tier_requests",
            model_name="gemini-3.8-flash"
        )

        res = await ocr_service.analyze_image(b64, mode="notice")

        assert res["extracted_text"] == "", "Must not fabricate extracted text on quota error"
        assert res["is_interpreted_by_ai"] is False
        assert res["live_inference_blocked"] is True
        assert res["engine"] == "gemini_vision_quota_exhausted"
        assert "quota exceeded" in res["error"].lower()
        assert res["validation_details"]["image_readable"] is True
        assert res["structured_fields"]["retry_delay"] == 46.0
        assert res["has_readable_text"] is False

def test_api_vision_analyze_route_429_response_schema():
    """Verify /api/vision/analyze FastAPI endpoint returns HTTP 200 with compliant schema on provider quota exhaustion."""
    b64 = generate_sample_image_base64(100, 100)

    with patch("backend.services.ai_service.gemini_service.is_vision_configured", return_value=True), \
         patch("backend.services.ai_service.gemini_service.analyze_image_with_vision", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.side_effect = AIProviderQuotaExhaustedError(
            message="Gemini Vision API quota exceeded (RESOURCE_EXHAUSTED). Free tier daily limit reached.",
            retry_delay=46.0,
            quota_metric="free_tier_requests",
            model_name="gemini-3.8-flash"
        )

        res = client.post("/api/vision/analyze", json={
            "image_base64": b64,
            "mode": "token"
        })

        assert res.status_code == 200
        data = res.json()
        assert data["extracted_text"] == ""
        assert data["is_interpreted_by_ai"] is False
        assert data["live_inference_blocked"] is True
        assert "quota" in data["error"].lower()
        assert data["engine"] == "gemini_vision_quota_exhausted"
        assert data["validation_details"] is not None

def test_api_studio_understand_image_action_429_no_fake_tokens():
    """Verify /api/ai-studio understand_image action does NOT inject fake B-34 tokens during 429 quota exhaustion."""
    b64 = generate_sample_image_base64(100, 100)

    with patch("backend.services.ai_service.gemini_service.is_vision_configured", return_value=True), \
         patch("backend.services.ai_service.gemini_service.analyze_image_with_vision", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.side_effect = AIProviderQuotaExhaustedError(
            message="Gemini Vision API quota exceeded. Please retry in 46s.",
            retry_delay=46.0,
            model_name="gemini-3.8-flash"
        )

        res = client.post("/api/ai-studio", json={
            "action": "understand_image",
            "data": {
                "imageBase64": b64,
                "featureType": "token"
            }
        })

        assert res.status_code == 200
        data = res.json()
        assert data["extractedText"] == ""
        assert data["isInterpretedByAi"] is False
        assert data["liveInferenceBlocked"] is True
        assert data["queueDetails"] is None, "Must not inject fake queueDetails"
        assert data["documentBreakdown"] is None
        assert "quota" in data["error"].lower()

