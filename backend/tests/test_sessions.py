from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_session_and_planner_persistence():
    # 1. Create a session
    sess_res = client.post("/api/sessions", json={
        "id": "test-sess-001",
        "title": "College Office Application Followup",
        "domain": "College Office",
        "intent": "Submit document",
        "status": "completed",
        "transcript": [{"role": "user", "text": "Please sign this."}],
        "confirmed_facts": [{"field": "Counter", "value": "Counter 2"}],
        "unresolved_questions": [{"issue": "Missing calendar date"}],
        "followup_actions": [{"title": "Return to Counter 2"}]
    })
    assert sess_res.status_code == 201
    assert sess_res.json()["id"] == "test-sess-001"

    # 2. Retrieve session
    get_res = client.get("/api/sessions/test-sess-001")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "College Office Application Followup"

    # 3. Create a planner task
    task_res = client.post("/api/sessions/planner/tasks", json={
        "id": "task-test-001",
        "title": "Visit Counter 2 with original ID",
        "domain": "College Office",
        "priority": "high",
        "status": "pending"
    })
    assert task_res.status_code == 201
    assert task_res.json()["id"] == "task-test-001"

    # 4. List planner tasks
    tasks_res = client.get("/api/sessions/planner/tasks")
    assert tasks_res.status_code == 200
    assert any(t["id"] == "task-test-001" for t in tasks_res.json())

    # 5. Delete session
    del_res = client.delete("/api/sessions/test-sess-001")
    assert del_res.status_code == 204
