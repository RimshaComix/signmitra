from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_translation_curated_and_fallback():
    res = client.post("/api/language/translate", json={
        "text": "Please communicate in writing",
        "target_language": "Hindi"
    })
    assert res.status_code == 200
    data = res.json()
    assert "लिखकर" in data["translated_text"]
    assert data["target_language"] == "Hindi"

def test_simplification_endpoint():
    res = client.post("/api/language/simplify", json={
        "text": "Prior to entering the premises, it is mandatory that visitors subsequently furnish their identity cards.",
        "target_level": "grade5"
    })
    assert res.status_code == 200
    data = res.json()
    assert "simplified_text" in data
    assert len(data["key_points"]) > 0
