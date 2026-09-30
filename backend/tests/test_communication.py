import pytest
from starlette.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_translate_empty_text_returns_400():
    res = client.post("/api/communication/translate", json={
        "text": "   ",
        "target_language": "Hindi",
        "mode": "ai"
    })
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"].lower()

def test_translate_unsupported_language_returns_400():
    res = client.post("/api/communication/translate", json={
        "text": "Where is counter 4?",
        "target_language": "klingon",
        "mode": "ai"
    })
    assert res.status_code == 400
    assert "unsupported target language" in res.json()["detail"].lower()

def test_translate_deterministic_mode_curated():
    res = client.post("/api/communication/translate", json={
        "text": "Please write down the counter number",
        "target_language": "hi",
        "mode": "deterministic"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_ai"] is False
    assert data["engine"] == "curated_dictionary"
    assert "काउंटर नंबर" in data["translated_text"]
    assert data["target_language"] == "Hindi"

def test_translate_ai_mode_unconfigured_honest_disclosure():
    res = client.post("/api/communication/translate", json={
        "text": "Please write down the counter number",
        "target_language": "hi",
        "mode": "ai"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_ai"] is True
    # If no live provider key, system must disclose unconfigured fallback
    if data["live_inference_blocked"]:
        assert data["engine"] == "unconfigured_fallback"
        assert "blocked" in data["error"].lower() or "no active ai provider" in data["error"].lower()
    else:
        assert "llm" in data["engine"]

def test_rewrite_empty_text_returns_400():
    res = client.post("/api/communication/rewrite", json={
        "text": "",
        "mode": "polite"
    })
    assert res.status_code == 422 or res.status_code == 400

def test_rewrite_unconfigured_honest_disclosure():
    res = client.post("/api/communication/rewrite", json={
        "text": "give token now counter 2",
        "mode": "polite"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["original_text"] == "give token now counter 2"
    if data["live_inference_blocked"]:
        assert data["engine"] == "unconfigured_fallback"
        assert data["provenance"] == "Provider Unconfigured"
    else:
        assert "llm" in data["engine"]

