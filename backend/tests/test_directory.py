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


def test_places_search_unconfigured_google():
    res = client.get("/api/directory/places?query=Apollo%20Hospital&provider=google")
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] in ("google", "google_places")
    assert data["configured"] is False
    assert data["error"] == "GOOGLE_PLACES_API_KEY_NOT_CONFIGURED"
    assert "setup_guide" in data
    assert len(data["setup_guide"]) >= 4


def test_places_search_osm_live_or_structured():
    res = client.get("/api/directory/places?query=Apollo%20Hospital%20Chennai&provider=osm")
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] in ("osm", "openstreetmap_nominatim")
    assert data["configured"] is True
    assert "results" in data
    assert isinstance(data["results"], list)
    if len(data["results"]) > 0:
        first = data["results"][0]
        assert "place_id" in first
        assert "name" in first
        assert "formatted_address" in first
        assert "category" in first
        assert "provider" in first


def test_visit_plan_lifecycle():
    # 1. Create visit plan
    plan_payload = {
        "place_name": "AIIMS Ansari Nagar",
        "address": "Ansari Nagar East, New Delhi",
        "category": "Hospital / Healthcare",
        "visit_purpose": "Audiometry and consultation",
        "planned_date": "2026-10-15",
        "communication_preferences": ["ISL interpreter requested", "Written communication preferred"],
        "custom_notes": "Bring medical records from 2025.",
        "questions_to_confirm": ["Where is room 102?", "Is ISL staff available?"],
        "checklist": [{"id": "c1", "text": "Carry UDID Card", "checked": True}],
        "visit_notes": {"department": "ENT OPD", "contact_person": "Dr. Sharma"}
    }
    create_res = client.post("/api/directory/visit-plan", json=plan_payload)
    assert create_res.status_code == 201
    plan_data = create_res.json()
    assert plan_data["place_name"] == "AIIMS Ansari Nagar"
    plan_id = plan_data["id"]

    # 2. List visit plans
    list_res = client.get("/api/directory/visit-plans")
    assert list_res.status_code == 200
    plans = list_res.json()
    assert any(p["id"] == plan_id for p in plans)

    # 3. Get single visit plan
    get_res = client.get(f"/api/directory/visit-plan/{plan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["visit_purpose"] == "Audiometry and consultation"

    # 4. Delete visit plan
    del_res = client.delete(f"/api/directory/visit-plan/{plan_id}")
    assert del_res.status_code == 204

    # 5. Confirm deleted
    get_again = client.get(f"/api/directory/visit-plan/{plan_id}")
    assert get_again.status_code == 404


def test_accessibility_feedback():
    feedback_payload = {
        "place_name": "Apollo Hospital",
        "address": "Greams Road, Chennai",
        "department_visited": "Outpatient Billing",
        "date_observed": "2026-10-01",
        "support_observed": ["wheelchair_ramp", "visual_token_display"],
        "notes": "Ramp available at main gate with clear visual token screen.",
        "verification_level": "personally_observed"
    }
    fb_res = client.post("/api/directory/feedback", json=feedback_payload)
    assert fb_res.status_code == 201
    data = fb_res.json()
    assert data["status"] == "user_reported"
    assert data["place_name"] == "Apollo Hospital"


