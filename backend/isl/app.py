"""
FastAPI Service for SignMitra Static ISL Fingerspelling Recognition (V1).

Serves the trained 23-class static ISL classifier (`isl-static-v1`) trained on
`dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks`.
"""

import math
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.isl.predict import MODEL_DISPLAY_NAME, MODEL_ID, predictor
    from backend.isl.preprocessing import NUM_FEATURES
except ImportError:
    from predict import MODEL_DISPLAY_NAME, MODEL_ID, predictor
    from preprocessing import NUM_FEATURES

app = FastAPI(
    title="SignMitra ISL Recognition API",
    version="1.0.0",
    description="Static Indian Sign Language (ISL) 23-class fingerspelling landmark classifier.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validate_126_vector(vec: Any, context_label: str = "features") -> list[float]:
    if not isinstance(vec, list) or len(vec) != NUM_FEATURES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid '{context_label}' length: expected {NUM_FEATURES} landmark values, "
                f"got {len(vec) if isinstance(vec, list) else 'non-list'}."
            ),
        )
    cleaned: list[float] = []
    for val in vec:
        if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(float(val)):
            raise HTTPException(
                status_code=400,
                detail=f"'{context_label}' contains non-numeric or non-finite (NaN/Inf) values.",
            )
        cleaned.append(float(val))
    return cleaned


def extract_and_validate_payload(payload: Any) -> list[float] | list[list[float]]:
    """
    Validates incoming prediction payload.
    Accepts:
      - `{"features": [126 floats]}`
      - `{"landmarks": [126 floats]}`
      - `{"sequence": [[126 floats], ...]}`
    Raises HTTPException(status_code=400) if missing or malformed.
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Request payload must be a JSON object.")

    if "features" in payload:
        return _validate_126_vector(payload["features"], "features")

    if "landmarks" in payload:
        return _validate_126_vector(payload["landmarks"], "landmarks")

    if "sequence" in payload:
        seq = payload["sequence"]
        if not isinstance(seq, list) or len(seq) == 0:
            raise HTTPException(
                status_code=400,
                detail="'sequence' must be a non-empty list of 126-feature frames.",
            )
        return [_validate_126_vector(frame, f"sequence[{idx}]") for idx, frame in enumerate(seq)]

    raise HTTPException(
        status_code=400,
        detail="Request body must contain 'features' (126 floats), 'landmarks' (126 floats), or 'sequence'.",
    )


def get_isl_health_payload() -> dict[str, Any]:
    loaded = predictor.is_loaded
    meta = predictor.get_metadata()
    return {
        "status": "ok",
        "model_loaded": loaded,
        "model": MODEL_ID,
        "model_name": MODEL_DISPLAY_NAME,
        "classes": predictor.classes,
        "excluded_signs": ["H", "J", "Y"],
        "features": NUM_FEATURES,
        "threshold": predictor.confidence_threshold,
        "metadata": meta,
    }


def run_isl_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    validated_input = extract_and_validate_payload(payload)

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "status": "model_unavailable",
                "recognized": False,
                "prediction": None,
                "sign": None,
                "model_loaded": False,
                "model": MODEL_ID,
                "message": "ISL recognition model is not trained/configured.",
            },
        )

    try:
        return predictor.predict_features(validated_input)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "status": "model_unavailable",
                "recognized": False,
                "prediction": None,
                "sign": None,
                "model_loaded": False,
                "model": MODEL_ID,
                "message": str(exc),
            },
        ) from exc


@app.get("/health")
def health_check() -> dict[str, Any]:
    return get_isl_health_payload()


@app.post("/predict")
def predict_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return run_isl_prediction(payload)
