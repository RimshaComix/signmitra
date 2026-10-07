"""
Real-Time Static ISL Fingerspelling Inference & Webcam Predictor (V1).

Loads:
  - `backend/isl/model/isl_static_classifier.keras` (`ISLStaticDenseNet`)
  - `backend/isl/model/scaler.pkl` (`ISLFeaturePreprocessor`)
  - `backend/isl/model/labels.json` (23 static ISL classes)

Provides:
  - `ISLStaticPredictor`: Shared inference engine for FastAPI (`/predict`) and CLI.
  - Temporal prediction stabilizer (`TemporalPredictionSmoother`) for webcam loop.
"""

import json
import os
import sys
from collections import Counter, deque
from pathlib import Path
from typing import Any

import numpy as np

try:
    from backend.isl.preprocessing import (
        FEATURES_PER_HAND,
        ISLFeaturePreprocessor,
        NUM_FEATURES,
        extract_126_features,
    )
    from backend.isl.train import (
        DEFAULT_MODEL_PATH,
        LABELS_PATH,
        METADATA_PATH,
        SCALER_PATH,
        ISLStaticDenseNet,
    )
    from backend.isl.validate_dataset import EXPECTED_CLASSES
except ImportError:
    from preprocessing import (
        FEATURES_PER_HAND,
        ISLFeaturePreprocessor,
        NUM_FEATURES,
        extract_126_features,
    )
    from train import (
        DEFAULT_MODEL_PATH,
        LABELS_PATH,
        METADATA_PATH,
        SCALER_PATH,
        ISLStaticDenseNet,
    )
    from validate_dataset import EXPECTED_CLASSES

MODEL_ID = "isl-static-v1"
MODEL_DISPLAY_NAME = "ISL Static V1"
BASE_DIR = Path(__file__).resolve().parent


def get_confidence_threshold() -> float:
    try:
        val = float(os.getenv("ISL_CONFIDENCE_THRESHOLD", "0.75"))
        return max(0.01, min(0.99, val))
    except ValueError:
        return 0.75


def resolve_model_path() -> Path:
    env_p = os.getenv("ISL_MODEL_PATH")
    if env_p:
        p = Path(env_p)
        if not p.is_absolute():
            p = (BASE_DIR.parent.parent / p).resolve()
        if p.exists():
            return p
    return DEFAULT_MODEL_PATH


class ISLStaticPredictor:
    """
    Loads the trained 23-class static ISL classifier (`isl_static_classifier.keras`)
    and fitted `StandardScaler` (`scaler.pkl`) and performs real inference on
    126-element hand landmark vectors.
    Never fabricates labels or confidence scores.
    """

    def __init__(
        self,
        model_path: Path | None = None,
        scaler_path: Path = SCALER_PATH,
        labels_path: Path = LABELS_PATH,
        confidence_threshold: float | None = None,
    ) -> None:
        self._custom_model_path = model_path
        self.scaler_path = scaler_path
        self.labels_path = labels_path
        self._custom_threshold = confidence_threshold

        self._model: ISLStaticDenseNet | None = None
        self._preprocessor: ISLFeaturePreprocessor | None = None
        self._classes: list[str] = list(EXPECTED_CLASSES)
        self._loaded_mtime: float | None = None
        self._load_error: str | None = None

    @property
    def model_path(self) -> Path:
        return self._custom_model_path if self._custom_model_path is not None else resolve_model_path()

    @property
    def confidence_threshold(self) -> float:
        if self._custom_threshold is not None:
            return self._custom_threshold
        return get_confidence_threshold()

    def reload_weights(self, force: bool = True) -> bool:
        """
        Forces a fresh reload of `isl_static_classifier.keras`, `scaler.pkl`, and `labels.json`
        from disk (used at FastAPI server startup and after retraining).
        """
        if force:
            self._loaded_mtime = None
            self._model = None
            self._preprocessor = None
        return self.load_if_available()

    def load_if_available(self) -> bool:
        m_path = self.model_path
        if not m_path.exists() or not self.scaler_path.exists():
            self._model = None
            self._preprocessor = None
            self._load_error = "ISL recognition model is not trained/configured."
            return False

        try:
            current_mtime = max(m_path.stat().st_mtime, self.scaler_path.stat().st_mtime)
            if self._model is not None and self._preprocessor is not None and self._loaded_mtime == current_mtime:
                return True

            if self.labels_path.exists():
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    lbl_data = json.load(f)
                if isinstance(lbl_data.get("classes"), list) and len(lbl_data["classes"]) == 23:
                    self._classes = [str(c) for c in lbl_data["classes"]]

            self._model = ISLStaticDenseNet.load(m_path)
            self._preprocessor = ISLFeaturePreprocessor.load(self.scaler_path)
            self._loaded_mtime = current_mtime
            self._load_error = None
            return True
        except Exception as exc:
            self._model = None
            self._preprocessor = None
            self._load_error = f"Failed to load ISL model artifacts: {exc}"
            return False

    @property
    def is_loaded(self) -> bool:
        return self.load_if_available()

    @property
    def classes(self) -> list[str]:
        self.load_if_available()
        return self._classes

    @property
    def load_error(self) -> str | None:
        return self._load_error

    def get_metadata(self) -> dict[str, Any]:
        if METADATA_PATH.exists():
            try:
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "model_name": MODEL_DISPLAY_NAME,
            "model_id": MODEL_ID,
            "classes": len(self._classes),
            "features": NUM_FEATURES,
            "threshold": self.confidence_threshold,
        }

    def predict_features(self, features: list[float] | np.ndarray) -> dict[str, Any]:
        """
        Runs inference on a single 126-element landmark vector.
        Raises ValueError on malformed feature shape/values.
        Raises FileNotFoundError if model or scaler is not trained/available.
        """
        arr = np.asarray(features, dtype=np.float32)
        if arr.ndim == 2 and arr.shape[1] == NUM_FEATURES and arr.shape[0] >= 1:
            # If a sequence of frames was supplied, average non-zero frames or take final frame
            non_zero_mask = np.any(np.abs(arr) > 1e-6, axis=1)
            if np.any(non_zero_mask):
                arr = np.mean(arr[non_zero_mask], axis=0)
            else:
                arr = arr[-1]

        if arr.shape != (NUM_FEATURES,):
            raise ValueError(
                f"Invalid feature shape {arr.shape}. Expected ({NUM_FEATURES},) landmark vector."
            )

        if not np.all(np.isfinite(arr)):
            raise ValueError("Feature vector contains NaN or infinite values.")

        if not self.load_if_available() or self._model is None or self._preprocessor is None:
            raise FileNotFoundError(
                self._load_error or "ISL recognition model is not trained/configured."
            )

        threshold = self.confidence_threshold

        # Reject all-zero vector (no hands visible) without claiming a sign prediction
        if not np.any(np.abs(arr) > 1e-6):
            return {
                "success": True,
                "status": "uncertain",
                "recognized": False,
                "prediction": None,
                "sign": None,
                "confidence": 0.0,
                "confidencePercent": 0.0,
                "threshold": threshold,
                "top_predictions": [],
                "message": "Uncertain — adjust your hand position.",
                "model": MODEL_ID,
            }

        X_scaled = self._preprocessor.transform(arr.reshape(1, NUM_FEATURES))
        probs = self._model.predict_proba(X_scaled)[0]

        sorted_indices = np.argsort(probs)[::-1]
        classes = self._classes

        top_predictions = [
            {
                "label": classes[int(idx)],
                "confidence": round(float(probs[int(idx)]), 4),
            }
            for idx in sorted_indices[:3]
        ]

        best_idx = int(sorted_indices[0])
        best_label = classes[best_idx]
        best_conf = float(probs[best_idx])
        best_conf_pct = round(best_conf * 100.0, 1)

        if best_conf >= threshold:
            return {
                "success": True,
                "status": "recognized",
                "recognized": True,
                "prediction": best_label,
                "sign": best_label,
                "confidence": round(best_conf, 4),
                "confidencePercent": best_conf_pct,
                "threshold": threshold,
                "top_predictions": top_predictions,
                "message": "Sign recognized.",
                "model": MODEL_ID,
            }
        else:
            return {
                "success": True,
                "status": "uncertain",
                "recognized": False,
                "prediction": None,
                "sign": None,
                "confidence": round(best_conf, 4),
                "confidencePercent": best_conf_pct,
                "threshold": threshold,
                "top_predictions": top_predictions,
                "message": "Uncertain — adjust your hand position.",
                "model": MODEL_ID,
            }


class TemporalPredictionSmoother:
    """
    Lightweight temporal smoother for live webcam predictions.
    Maintains a rolling window of the latest `window_size` predictions and requires
    `min_agreement` identical predictions above threshold to stabilize output.
    """

    def __init__(self, window_size: int = 5, min_agreement: int = 3) -> None:
        self.window_size = window_size
        self.min_agreement = min_agreement
        self.buffer: deque[tuple[str | None, float]] = deque(maxlen=window_size)

    def reset(self) -> None:
        self.buffer.clear()

    def update(self, prediction: str | None, confidence: float) -> tuple[str | None, float]:
        self.buffer.append((prediction, confidence))
        valid = [(lbl, conf) for lbl, conf in self.buffer if lbl is not None]
        if len(valid) < self.min_agreement:
            return None, confidence

        counts = Counter(lbl for lbl, _ in valid)
        top_label, count = counts.most_common(1)[0]
        if count >= self.min_agreement:
            avg_conf = float(np.mean([conf for lbl, conf in valid if lbl == top_label]))
            return top_label, round(avg_conf, 4)

        return None, confidence


predictor = ISLStaticPredictor()


def run_webcam_prediction(camera_index: int = 0) -> None:
    try:
        import cv2
        import mediapipe as mp
    except ImportError as exc:
        print(
            f"[ERROR] Missing webcam/MediaPipe dependency ({exc}).\n"
            "Install requirements: pip install -r backend/isl/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    if not predictor.load_if_available():
        print(f"[ERROR] {predictor.load_error}", file=sys.stderr)
        sys.exit(1)

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"[ERROR] Could not open webcam at index {camera_index}.", file=sys.stderr)
        sys.exit(1)

    smoother = TemporalPredictionSmoother(window_size=5, min_agreement=3)
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    try:
        with mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as hands_detector:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_flipped = cv2.flip(frame, 1)
                rgb = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
                results = hands_detector.process(rgb)

                left_pts = None
                right_pts = None

                if results.multi_hand_landmarks and results.multi_handedness:
                    for hand_lms, handedness in zip(
                        results.multi_hand_landmarks[:2], results.multi_handedness[:2]
                    ):
                        mp_drawing.draw_landmarks(
                            frame_flipped, hand_lms, mp_hands.HAND_CONNECTIONS
                        )
                        pts = [(lm.x, lm.y, lm.z) for lm in hand_lms.landmark]
                        label = handedness.classification[0].label
                        if label == "Left" and left_pts is None:
                            left_pts = pts
                        elif label == "Right" and right_pts is None:
                            right_pts = pts
                        elif left_pts is None:
                            left_pts = pts
                        else:
                            right_pts = pts

                feat_126 = extract_126_features(left_pts, right_pts)
                res = predictor.predict_features(feat_126)
                stable_sign, stable_conf = smoother.update(res["prediction"], res["confidence"])

                h, w, _ = frame_flipped.shape
                cv2.rectangle(frame_flipped, (0, 0), (w, 90), (25, 20, 35), -1)

                if stable_sign:
                    text = f"Sign: {stable_sign} ({stable_conf * 100:.1f}%)"
                    color = (80, 220, 100)
                else:
                    text = "Uncertain — adjust your hand position"
                    color = (120, 180, 255)

                cv2.putText(frame_flipped, text, (16, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                cv2.putText(
                    frame_flipped,
                    "Static ISL V1 (23 signs) | Press 'Q' to quit",
                    (16, 74),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (200, 200, 200),
                    1,
                )
                cv2.imshow("SignMitra Static ISL V1", frame_flipped)
                if (cv2.waitKey(1) & 0xFF) in (ord("q"), ord("Q")):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run_webcam_prediction()
