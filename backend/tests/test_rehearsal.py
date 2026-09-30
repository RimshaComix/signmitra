from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_rehearsal_scenario_generation():
    res = client.post("/api/rehearsal/scenario", json={
        "domain": "Bank Counter",
        "persona_type": "standard"
    })
    assert res.status_code == 200
    data = res.json()
    assert "scenario_id" in data
    assert "persona_name" in data
    assert len(data["learning_objectives"]) >= 2

def test_rehearsal_evaluation_rubric():
    res = client.post("/api/rehearsal/evaluate", json={
        "scenario_id": "test-scenario-1",
        "domain": "Bank Counter",
        "history": [{"role": "assistant", "content": "What service do you need?"}],
        "user_reply": "Hello, I am Deaf. Please read my written KYC form and Aadhaar card."
    })
    assert res.status_code == 200
    data = res.json()
    assert "staff_response" in data
    assert "actionable_feedback" in data
    assert len(data["rubric_scores"]) == 3
    assert data["overall_readiness_score"] > 0
