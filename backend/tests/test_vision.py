import base64
import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def generate_sample_image_base64(width=100, height=100):
    img = Image.new('RGB', (width, height), color='white')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def test_vision_valid_image():
    b64 = generate_sample_image_base64(120, 120)
    res = client.post("/api/vision/analyze", json={
        "image_base64": b64,
        "mode": "notice"
    })
    assert res.status_code == 200
    data = res.json()
    assert "extracted_text" in data
    assert "structured_fields" in data
    assert "engine" in data

def test_vision_invalid_corrupted_base64():
    res = client.post("/api/vision/analyze", json={
        "image_base64": "not_a_valid_base64_string_!!!",
        "mode": "notice"
    })
    assert res.status_code == 400
    assert "Invalid base64" in res.json()["detail"]

def test_vision_too_small_image():
    # 20x20 is below minimum dimension of 50
    b64 = generate_sample_image_base64(20, 20)
    res = client.post("/api/vision/analyze", json={
        "image_base64": b64,
        "mode": "notice"
    })
    assert res.status_code == 400
    assert "too small" in res.json()["detail"]
