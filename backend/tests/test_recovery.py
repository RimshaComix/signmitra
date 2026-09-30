from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app
from backend.services.ai_service import gemini_service
from backend.services.ai_provider import AIProviderExecutionError

client = TestClient(app)

def test_recovery_prepare_and_extract_flow():
    # 1. Prepare
    prep_res = client.post("/api/recovery/prepare", json={
        "context": "College Office",
        "goal": "Submit an incomplete application and clarify missing documents",
        "preferences": "Writing + Large Text"
    })
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    assert len(prep_data["checklist"]) >= 3
    assert len(prep_data["cards"]) >= 2
    assert "provenance" in prep_data

    # 2. Extract with ambiguous relative date
    extract_res = client.post("/api/recovery/extract", json={
        "text": "Go to Counter 2. Bring your student ID. Return tomorrow morning.",
        "context": "College Office"
    })
    assert extract_res.status_code == 200
    extract_data = extract_res.json()
    assert "tomorrow morning" in extract_data["relative_dates_detected"]
    assert any("Counter 2" in f["value"] for f in extract_data["facts"])
    assert any("student ID" in f["value"] for f in extract_data["facts"])
    
    # Check strict provenance on all extracted facts
    for f in extract_data["facts"]:
        assert f["provenance"] == "AI-extracted"
        assert f["status"] == "Unresolved"

    # 3. Summarize separating confirmed facts from open gaps
    summary_res = client.post("/api/recovery/summarize", json={
        "context": "College Office",
        "goal": "Submit application",
        "confirmed_facts": [
            {"field": "Location", "value": "Counter 2", "status": "User-confirmed"}
        ],
        "unresolved_questions": [
            {"issue": "Missing calendar date for tomorrow morning", "quote": "tomorrow morning"}
        ]
    })
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert "Counter 2" in summary_data["summary"]
    assert len(summary_data["suggested_tasks"]) >= 1

def test_critical_regression_input_via_action_dispatcher():
    """
    CRITICAL PROMPT TEST:
    Input: 'Go to Counter 2. Bring your student ID. Return tomorrow morning.'
    Expected:
    - Counter 2 and student ID extracted, NOT user-confirmed
    - 'tomorrow morning' detected as relative time
    - No invented calendar date or time
    - Clarification card generated
    """
    payload = {
        "action": "explain_plain_language",
        "data": {
            "text": "Go to Counter 2. Bring your student ID. Return tomorrow morning.",
            "context": "College Office"
        }
    }
    res = client.post("/api/ai-studio", json=payload)
    assert res.status_code == 200
    data = res.json()

    # 1. Location extracted
    assert "COUNTER 2" in data["keyDetails"]["locationOrCounter"]

    # 2. No calendar date invented
    assert "Thursday" not in data["keyDetails"]["deadline"]
    assert "2:30 PM" not in data["keyDetails"]["deadline"]
    assert "tomorrow morning" in data["keyDetails"]["deadline"]

    # 3. Relative time detected
    assert "tomorrow morning" in data["relative_dates_detected"]

    # 4. Strict provenance: facts are AI-extracted & Unresolved
    facts = data["facts"]
    assert len(facts) >= 2
    for f in facts:
        assert f["provenance"] == "AI-extracted"
        assert f["status"] == "Unresolved"

def test_provider_failure_graceful_disclosure():
    """
    Ensures that when an AI provider fails or throws, the system does not
    fabricate output and cleanly discloses the engine state.
    """
    with patch.object(gemini_service, "is_configured", return_value=True):
        with patch.object(gemini_service, "generate_structured_json", side_effect=AIProviderExecutionError("Rate limit exceeded")):
            res = client.post("/api/recovery/prepare", json={
                "context": "Bank Branch",
                "goal": "Update KYC",
                "preferences": "Visual"
            })
            assert res.status_code == 200
            data = res.json()
            # Returns deterministic baseline with transparent engine disclosure
            assert "deterministic_copilot" in data["engine"]
            assert len(data["checklist"]) >= 3
