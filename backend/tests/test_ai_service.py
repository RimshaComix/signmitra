import pytest
from unittest.mock import MagicMock, AsyncMock
from backend.services.ai_provider import (
    GeminiAdapter,
    GroqAdapter,
    UnconfiguredProvider,
    get_ai_provider,
    AIProviderNotConfiguredException,
    AIProviderExecutionError
)
from backend.services.ai_service import GeminiService

def test_ai_service_unconfigured():
    provider = UnconfiguredProvider()
    assert provider.is_configured() is False
    assert "No AI provider key" in provider.get_status()["status_message"]
    
    import asyncio
    with pytest.raises(AIProviderNotConfiguredException) as exc_info:
        asyncio.run(provider.generate_text("Hello"))
    assert "GROQ_API_KEY" in str(exc_info.value) or "GEMINI_API_KEY" in str(exc_info.value)

def test_gemini_adapter_mocked_inference():
    """
    Tests Gemini provider adapter contract via structured client mock.
    """
    adapter = GeminiAdapter(api_key="mock_gemini_key_123")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"summary": "Test plain explanation", "action_step": "Visit Counter 2"}'
    mock_client.models.generate_content.return_value = mock_response
    adapter._client = mock_client

    import asyncio
    result = asyncio.run(adapter.generate_json("Analyze response"))
    assert result["summary"] == "Test plain explanation"
    assert result["action_step"] == "Visit Counter 2"

def test_gemini_adapter_malformed_json_handling():
    adapter = GeminiAdapter(api_key="mock_gemini_key_123")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = 'NOT_JSON_AT_ALL'
    mock_client.models.generate_content.return_value = mock_response
    adapter._client = mock_client

    import asyncio
    with pytest.raises(AIProviderExecutionError) as exc_info:
        asyncio.run(adapter.generate_json("Analyze response"))
    assert "not valid JSON" in str(exc_info.value)

def test_groq_adapter_configuration():
    adapter = GroqAdapter(api_key="gsk_test123456789")
    assert adapter.is_configured() is True
    assert adapter.provider_name == "groq"
    assert "llama" in adapter.model_name.lower()

def test_unified_service_delegation():
    service = GeminiService()
    mock_provider = MagicMock()
    mock_provider.generate_json = AsyncMock(return_value={"status": "mock_success"})
    mock_provider.is_configured.return_value = True
    service._provider = mock_provider

    import asyncio
    res = asyncio.run(service.generate_structured_json("Test prompt"))
    assert res["status"] == "mock_success"
