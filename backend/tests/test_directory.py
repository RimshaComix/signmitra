from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_directory_crud_and_search():
    # 1. List directory seeded records
    list_res = client.get("/api/directory")
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) >= 3

    # 2. Filter by wheelchair and city
    delhi_res = client.get("/api/directory?city=Delhi&wheelchair_only=true")
    assert delhi_res.status_code == 200
    delhi_records = delhi_res.json()
    assert all("delhi" in r["city"].lower() for r in delhi_records)

    # 3. Create record
    create_res = client.post("/api/directory", json={
        "name": "Test Hospital Accessibility Desk",
        "domain": "hospital",
        "city": "Bengaluru",
        "address": "Victoria Hospital Complex",
        "wheelchair_accessible": True,
        "sign_assistance_desk": True,
        "token_display_system": True,
        "written_communication_desk": True,
        "notes": "Verified Divyangjan counter with visual indicator.",
        "verified_status": "verified"
    })
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # 4. Get record
    get_res = client.get(f"/api/directory/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Hospital Accessibility Desk"

    # 5. Delete record
    del_res = client.delete(f"/api/directory/{created_id}")
    assert del_res.status_code == 204
