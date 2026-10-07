from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from backend.isl.predict import MODEL_ID, ISLStaticPredictor, TemporalPredictionSmoother, predictor
from backend.isl.preprocessing import (
    FEATURES_PER_HAND,
    ISLFeaturePreprocessor,
    NUM_FEATURES,
    ensure_wrist_relative_batch,
    extract_126_features,
    hand_to_wrist_relative,
)
from backend.isl.validate_dataset import EXPECTED_CLASSES, EXPECTED_FEATURE_COLUMNS
from backend.main import app

client = TestClient(app)


def _make_sample_hand(seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.uniform(0.2, 0.8, size=(21, 3)).astype(np.float32)


def test_1_dataset_preprocessing_and_wrist_and_scale_invariance():
    """1. Dataset preprocessing: wrist-relative translation invariance AND Landmark 0->9 distance scale invariance."""
    hand = _make_sample_hand(10)
    shifted_hand = hand + np.array([0.25, -0.15, 0.05], dtype=np.float32)

    rel_a = hand_to_wrist_relative(hand)
    rel_b = hand_to_wrist_relative(shifted_hand)

    assert rel_a.shape == (63,)
    assert np.allclose(rel_a[:3], 0.0, atol=1e-6)
    assert np.allclose(rel_a, rel_b, atol=1e-6)

    # Distance scale invariance (close to lens vs far back from lens)
    hand_close = hand * 2.5
    hand_far = hand * 0.4
    vec_close = extract_126_features(None, hand_close)
    vec_far = extract_126_features(None, hand_far)

    # Verify Landmark 0 to Landmark 9 distance on active right hand (indices 63+27..63+30) is normalized to 1.0
    d09_close = float(np.linalg.norm(vec_close[63 + 27 : 63 + 30]))
    d09_far = float(np.linalg.norm(vec_far[63 + 27 : 63 + 30]))
    assert np.isclose(d09_close, 1.0, atol=1e-5)
    assert np.isclose(d09_far, 1.0, atol=1e-5)
    assert np.allclose(vec_close, vec_far, atol=1e-5)

    batch = np.vstack([
        extract_126_features(None, hand),
        extract_126_features(hand * 1.2, shifted_hand),
        extract_126_features(hand * 0.8, shifted_hand * 1.1),
    ])
    preprocessor = ISLFeaturePreprocessor()
    scaled = preprocessor.fit_transform(batch)
    assert scaled.shape == (3, 126)
    assert np.isfinite(scaled).all()


def test_2_feature_shape_is_126():
    """2. Feature shape = 126 (21 landmarks * 3 coords * 2 hands)."""
    assert NUM_FEATURES == 126
    assert FEATURES_PER_HAND == 63
    assert len(EXPECTED_FEATURE_COLUMNS) == 126
    assert EXPECTED_FEATURE_COLUMNS[0] == "left_lm0_x"
    assert EXPECTED_FEATURE_COLUMNS[62] == "left_lm20_z"
    assert EXPECTED_FEATURE_COLUMNS[63] == "right_lm0_x"
    assert EXPECTED_FEATURE_COLUMNS[125] == "right_lm20_z"


def test_3_label_mapping_23_static_signs():
    """3. Label mapping covers exact 23 static ISL signs and excludes H, J, Y."""
    assert len(EXPECTED_CLASSES) == 23
    for dyn in ("H", "J", "Y"):
        assert dyn not in EXPECTED_CLASSES
    assert EXPECTED_CLASSES[0] == "A"
    assert EXPECTED_CLASSES[-1] == "Z"
    assert predictor.classes == EXPECTED_CLASSES


def test_4_missing_hand_handling_and_single_hand_channel_swap():
    """4. Missing-hand handling preserves 63 zeros in [0:63] and swaps single hand into [63:126]."""
    hand = _make_sample_hand(7)

    # 0 hands -> 126 zeros
    zero_vec = extract_126_features(None, None)
    assert zero_vec.shape == (126,)
    assert np.all(zero_vec == 0.0)

    # 1 right hand -> [0:63] zeros, [63:126] populated
    one_hand_vec = extract_126_features(None, hand)
    assert one_hand_vec.shape == (126,)
    assert np.all(one_hand_vec[:63] == 0.0)
    assert np.allclose(one_hand_vec[63:66], 0.0, atol=1e-6)
    assert float(np.abs(one_hand_vec[66:]).max()) > 0.0

    # Even if mirror view caused a single hand to be passed as 'left', extract_126_features
    # intercepts and swaps channels so [0:63] is purely zero-filled and [63:126] is populated
    swapped_vec = extract_126_features(hand, None)
    assert np.all(swapped_vec[:63] == 0.0)
    assert np.allclose(swapped_vec[63:], one_hand_vec[63:], atol=1e-6)

    # Ensure batch wrist-relative leaves missing hand slot as zeros
    batch_rel = ensure_wrist_relative_batch(one_hand_vec.reshape(1, 126))
    assert np.all(batch_rel[0, :63] == 0.0)


def test_5_and_9_prediction_endpoint_validation_and_invalid_input_rejection():
    """5 & 9. Prediction endpoint validates inputs and rejects malformed payloads."""
    res_empty = client.post("/predict", json={})
    assert res_empty.status_code == 400

    res_short = client.post("/predict", json={"features": [0.1] * 10})
    assert res_short.status_code == 400
    assert "126" in res_short.json()["detail"]

    res_nan = client.post("/predict", json={"features": ["bad"] * 126})
    assert res_nan.status_code == 400

    res_zeros = client.post("/predict", json={"features": [0.0] * 126})
    assert res_zeros.status_code == 200
    z_data = res_zeros.json()
    assert z_data["status"] == "uncertain"
    assert z_data["recognized"] is False
    assert z_data["prediction"] is None


def test_6_model_unavailable_behavior():
    """6. When model checkpoint is unavailable, endpoint returns HTTP 503 honestly."""
    untrained_predictor = ISLStaticPredictor(
        model_path=Path("non_existent_dir/isl_static_classifier.keras"),
        scaler_path=Path("non_existent_dir/scaler.pkl"),
    )
    assert untrained_predictor.is_loaded is False

    hand = _make_sample_hand(12)
    vec = extract_126_features(None, hand).tolist()

    with patch("backend.isl.app.predictor", untrained_predictor):
        res_health = client.get("/health")
        assert res_health.status_code == 200
        h_data = res_health.json()
        assert h_data["model_loaded"] is False

        res_pred = client.post("/predict", json={"features": vec})
        assert res_pred.status_code == 503
        detail = res_pred.json()["detail"]
        assert detail["success"] is False
        assert detail["status"] == "model_unavailable"
        assert detail["recognized"] is False
        assert detail["prediction"] is None


def test_7_confidence_threshold_and_temporal_smoothing():
    """7. Confidence threshold gating (>= 0.75 recognized vs < 0.75 uncertain) and temporal smoother."""
    hand = _make_sample_hand(99)
    vec = extract_126_features(None, hand)

    strict_predictor = ISLStaticPredictor(confidence_threshold=0.999999)
    res_strict = strict_predictor.predict_features(vec)
    if res_strict["confidence"] < 0.999999:
        assert res_strict["status"] == "uncertain"
        assert res_strict["recognized"] is False
        assert res_strict["prediction"] is None

    lenient_predictor = ISLStaticPredictor(confidence_threshold=0.01)
    res_lenient = lenient_predictor.predict_features(vec)
    assert res_lenient["status"] == "recognized"
    assert res_lenient["recognized"] is True
    assert res_lenient["prediction"] in EXPECTED_CLASSES

    smoother = TemporalPredictionSmoother(window_size=5, min_agreement=3)
    s1, _ = smoother.update("A", 0.92)
    assert s1 is None
    s2, _ = smoother.update("A", 0.94)
    assert s2 is None
    s3, conf3 = smoother.update("A", 0.96)
    assert s3 == "A"
    assert conf3 >= 0.92


def test_8_and_12_valid_prediction_response_schema_and_real_held_out_inference():
    """8 & 12. Valid prediction schema, scale invariance on real held-out sample, and preprocessing consistency."""
    held_out_csv = Path(__file__).resolve().parent.parent / "isl" / "dataset" / "kaggle_isl" / "held_out_dataset.csv"
    if held_out_csv.exists():
        df = pd.read_csv(held_out_csv, nrows=5)
        row = df.iloc[0]
        true_label = str(row["label"]).strip()
        features = [float(row[c]) for c in EXPECTED_FEATURE_COLUMNS]
    else:
        true_label = None
        features = extract_126_features(_make_sample_hand(1), _make_sample_hand(2)).tolist()

    res = client.post("/predict", json={"features": features})
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert data["status"] in ("recognized", "uncertain")
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0
    assert isinstance(data["top_predictions"], list)
    assert len(data["top_predictions"]) == 3
    for item in data["top_predictions"]:
        assert item["label"] in EXPECTED_CLASSES
        assert 0.0 <= item["confidence"] <= 1.0
    assert data["model"] == MODEL_ID

    if true_label is not None:
        assert data["status"] == "recognized"
        assert data["recognized"] is True
        assert data["prediction"] == true_label
        assert data["confidence"] >= 0.75

        # Verify camera-distance scale invariance on real held-out test row (close vs far)
        features_close = [v * 2.5 for v in features]
        features_far = [v * 0.4 for v in features]
        res_close = client.post("/predict", json={"features": features_close}).json()
        res_far = client.post("/predict", json={"features": features_far}).json()
        assert res_close["prediction"] == true_label
        assert res_far["prediction"] == true_label
        assert abs(res_close["confidence"] - res_far["confidence"]) < 1e-5


def test_10_health_and_status_endpoints():
    """10. Health and status endpoints report loaded model, 23 classes, and measured metrics."""
    for path in ("/health", "/api/isl/health"):
        res = client.get(path)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["model_loaded"] is True
        assert data["model"] == MODEL_ID
        assert data["classes"] == EXPECTED_CLASSES
        assert data["excluded_signs"] == ["H", "J", "Y"]
        assert data["features"] == 126

    status_res = client.get("/api/isl/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert "pipeline_architecture" in s_data

    cat_res = client.get("/api/isl/catalog?query=Doctor")
    assert cat_res.status_code == 200
    items = cat_res.json()
    assert len(items) >= 1
    assert items[0]["english"] == "Doctor"


def test_11_no_fake_vocabulary_generation():
    """11. Ensure predictions are strictly deterministic from model weights and never cycle fake phrases."""
    hand = _make_sample_hand(21)
    features = extract_126_features(None, hand).tolist()

    r1 = client.post("/predict", json={"features": features}).json()
    r2 = client.post("/predict", json={"features": features}).json()

    assert r1["top_predictions"] == r2["top_predictions"]
    assert abs(r1["confidence"] - r2["confidence"]) < 1e-6
    assert r1["top_predictions"][0]["label"] in EXPECTED_CLASSES
