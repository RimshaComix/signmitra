from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_isl_status_and_catalog():
    # 1. Pipeline status
    res = client.get("/api/isl/status")
    assert res.status_code == 200
    data = res.json()
    assert "pipeline_architecture" in data
    assert "practice_mirror_available" in data
    # Must report Model Checkpoint Required honestly
    assert data["status"] == "Model Checkpoint Required"

    # 2. ISLRTC reference catalog search
    cat_res = client.get("/api/isl/catalog?query=Doctor")
    assert cat_res.status_code == 200
    items = cat_res.json()
    assert len(items) >= 1
    assert items[0]["english"] == "Doctor"
    assert "handshape" in items[0]

    # 3. Honest rejection of automated inference without checkpoint
    rec_res = client.post("/api/isl/recognize", json={"frames": []})
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["success"] is False
    assert "Model Checkpoint Required" in rec_data["error"]
