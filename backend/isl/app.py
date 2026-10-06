"""
FastAPI Service for SignMitra Isolated-Sign ISL Recognition (V1).

Can be run standalone:
  cd backend/isl
  uvicorn app:app --reload --port 8000

And is also integrated into the main SignMitra FastAPI backend (`backend/main.py`).
"""

import math
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.isl.extract_landmarks import FEATURES_PER_FRAME, SEQUENCE_LENGTH
    from backend.isl.predict import MODEL_NAME, predictor
except ImportError:
    from extract_landmarks import FEATURES_PER_FRAME, SEQUENCE_LENGTH
    from predict import MODEL_NAME, predictor

app = FastAPI(
    title="SignMitra ISL Recognition API",
    version="1.0.0",
    description="Isolated-sign Indian Sign Language (ISL) BiLSTM sequence classifier.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_sequence_payload(payload: Any) -> list[list[float]]:
    """
    Strictly validates that `payload` is a dict containing `"sequence"` with
    exact shape (30, 126) of finite numbers.
    Raises HTTPException(status_code=400) on any validation failure.
    """
    if not isinstance(payload, dict) or "sequence" not in payload:
        raise HTTPException(
            status_code=400,
            detail="Request body must contain a 'sequence' field.",
        )

    seq = payload["sequence"]
    if not isinstance(seq, list) or len(seq) != SEQUENCE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sequence length: expected {SEQUENCE_LENGTH} frames, got {len(seq) if isinstance(seq, list) else 'non-list'}.",
        )

    validated: list[list[float]] = []
    for frame_idx, frame in enumerate(seq):
        if not isinstance(frame, list) or len(frame) != FEATURES_PER_FRAME:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid frame at index {frame_idx}: expected {FEATURES_PER_FRAME} features, "
                    f"got {len(frame) if isinstance(frame, list) else 'non-list'}."
                ),
            )
        row: list[float] = []
        for val in frame:
            if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(float(val)):
                raise HTTPException(
                    status_code=400,
                    detail=f"Frame {frame_idx} contains non-numeric or non-finite values.",
                )
            row.append(float(val))
        validated.append(row)

    return validated


def get_isl_health_payload() -> dict[str, Any]:
    loaded = predictor.is_loaded
    return {
        "status": "ok",
        "model_loaded": loaded,
        "model": MODEL_NAME,
        "classes": predictor.classes,
    }


def run_isl_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    validated_seq = validate_sequence_payload(payload)

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail={
                "recognized": False,
                "sign": None,
                "model_loaded": False,
                "model": MODEL_NAME,
                "message": (
                    "Recognition model not trained yet. Collect training data and train the model "
                    "before using live recognition."
                ),
            },
        )

    try:
        return predictor.predict_sequence(validated_seq)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "recognized": False,
                "sign": None,
                "model_loaded": False,
                "model": MODEL_NAME,
                "message": str(exc),
            },
        ) from exc


@app.get("/health")
def health_check() -> dict[str, Any]:
    return get_isl_health_payload()


@app.post("/predict")
def predict_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return run_isl_prediction(payload)

