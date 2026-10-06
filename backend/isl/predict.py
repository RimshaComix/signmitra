"""
Real-Time Isolated-Sign ISL Inference & Local Webcam Predictor (V1).

Provides:
1. `ISLModelPredictor`: Thread-safe model loader and sequence classifier used by
   both FastAPI (`app.py` / `backend.main`) and local CLI inference.
2. CLI webcam loop (`python predict.py`):
   - Extracts MediaPipe hand landmarks (126 features/frame)
   - Maintains a rolling 30-frame sequence
   - Runs trained BiLSTM (`model/isl_lstm.keras`)
   - Applies `CONFIDENCE_THRESHOLD = 0.75`
   - Displays either the recognized sign with genuine softmax probability or "UNCERTAIN"
"""

import json
import sys
from collections import deque
from pathlib import Path
from typing import Any

import numpy as np

try:
    from backend.isl.extract_landmarks import (
        FEATURES_PER_FRAME,
        SEQUENCE_LENGTH,
        SIGNS,
        extract_mediapipe_hands_from_frame,
    )
except ImportError:
    from extract_landmarks import (
        FEATURES_PER_FRAME,
        SEQUENCE_LENGTH,
        SIGNS,
        extract_mediapipe_hands_from_frame,
    )

CONFIDENCE_THRESHOLD = 0.75
MODEL_NAME = "isl-lstm-v1"

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "isl_lstm.keras"
LABELS_PATH = MODEL_DIR / "labels.json"


class ISLModelPredictor:
    """
    Manages loading `model/isl_lstm.keras` and `model/labels.json` and running
    validated 30x126 sequence predictions.
    Never fabricates predictions or confidence scores if the model does not exist.
    """

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        labels_path: Path = LABELS_PATH,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
    ) -> None:
        self.model_path = model_path
        self.labels_path = labels_path
        self.confidence_threshold = confidence_threshold
        self._model: Any = None
        self._classes: list[str] = list(SIGNS)
        self._load_error: str | None = None

    def load_if_available(self) -> bool:
        """
        Attempts to load the trained Keras model if `isl_lstm.keras` exists on disk.
        Returns True if loaded and ready, False otherwise.
        """
        if not self.model_path.exists():
            self._model = None
            self._load_error = (
                f"Trained model file not found at {self.model_path}. "
                "Collect real training data and run train.py first."
            )
            return False

        if self.labels_path.exists():
            try:
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    lbl_data = json.load(f)
                loaded_classes = lbl_data.get("classes")
                if isinstance(loaded_classes, list) and len(loaded_classes) > 0:
                    self._classes = [str(c) for c in loaded_classes]
            except Exception as exc:
                self._load_error = f"Failed to read labels.json: {exc}"

        if self._model is not None:
            return True

        try:
            import tensorflow as tf

            self._model = tf.keras.models.load_model(str(self.model_path))
            self._load_error = None
            return True
        except Exception as exc:
            self._model = None
            self._load_error = f"Failed to load Keras model: {exc}"
            return False

    @property
    def is_loaded(self) -> bool:
        return self.load_if_available()

    @property
    def classes(self) -> list[str]:
        if self.labels_path.exists():
            try:
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    lbl_data = json.load(f)
                if isinstance(lbl_data.get("classes"), list):
                    self._classes = [str(c) for c in lbl_data["classes"]]
            except Exception:
                pass
        return self._classes

    @property
    def load_error(self) -> str | None:
        return self._load_error

    def predict_sequence(self, sequence: list[list[float]] | np.ndarray) -> dict[str, Any]:
        """
        Runs inference on a single (30, 126) landmark sequence.
        Raises FileNotFoundError if the model is not trained/loaded.
        Raises ValueError if the sequence shape or contents are invalid.
        """
        arr = np.asarray(sequence, dtype=np.float32)
        if arr.shape != (SEQUENCE_LENGTH, FEATURES_PER_FRAME):
            raise ValueError(
                f"Invalid sequence shape {arr.shape}. Expected ({SEQUENCE_LENGTH}, {FEATURES_PER_FRAME})."
            )

        if not np.all(np.isfinite(arr)):
            raise ValueError("Sequence contains NaN or infinite values.")

        if not self.load_if_available():
            raise FileNotFoundError(
                self._load_error
                or "Recognition model not trained yet. Collect training data and train the model before using live recognition."
            )

        # Check how many frames actually contain hand landmarks (non-zero frames)
        non_zero_frames = int(np.sum(np.any(np.abs(arr) > 1e-6, axis=1)))
        if non_zero_frames < 5:
            return {
                "recognized": False,
                "sign": None,
                "confidence": 0.0,
                "confidencePercent": 0.0,
                "message": "No reliable sign detected (hands not visible in enough frames).",
                "model": MODEL_NAME,
            }

        batch = np.expand_dims(arr, axis=0)  # (1, 30, 126)
        probs = self._model.predict(batch, verbose=0)[0]
        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])
        confidence_percent = round(confidence * 100.0, 1)

        classes = self.classes
        predicted_label = classes[best_idx] if 0 <= best_idx < len(classes) else str(best_idx)

        if confidence >= self.confidence_threshold:
            return {
                "recognized": True,
                "sign": predicted_label,
                "confidence": round(confidence, 4),
                "confidencePercent": confidence_percent,
                "message": "Sign detected.",
                "model": MODEL_NAME,
            }
        else:
            return {
                "recognized": False,
                "sign": None,
                "confidence": round(confidence, 4),
                "confidencePercent": confidence_percent,
                "message": "No reliable sign detected.",
                "model": MODEL_NAME,
            }


predictor = ISLModelPredictor()


def run_webcam_prediction(camera_index: int = 0) -> None:
    try:
        import cv2
        import mediapipe as mp
    except ImportError as exc:
        print(
            f"[ERROR] Missing dependency ({exc}).\n"
            "Install requirements first: pip install -r backend/isl/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    if not predictor.load_if_available():
        print(
            f"[ERROR] {predictor.load_error}\n"
            "Cannot start live prediction before a real model is trained.",
            file=sys.stderr,
        )
        sys.exit(1)

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"[ERROR] Could not open webcam at index {camera_index}.", file=sys.stderr)
        sys.exit(1)

    rolling_buffer: deque[np.ndarray] = deque(maxlen=SEQUENCE_LENGTH)
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    print("=" * 68)
    print("SIGNMITRA ISL REAL-TIME WEBCAM PREDICTION (V1)")
    print(f"Model: {MODEL_NAME} | Threshold: {CONFIDENCE_THRESHOLD * 100:.0f}%")
    print(f"Classes: {', '.join(predictor.classes)}")
    print("Press 'Q' to exit.")
    print("=" * 68)

    last_result: dict[str, Any] = {
        "recognized": False,
        "sign": None,
        "confidence": 0.0,
        "confidencePercent": 0.0,
    }
    frame_counter = 0

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

                if results.multi_hand_landmarks:
                    hands_pts: list[list[tuple[float, float, float]]] = []
                    for hand_lms in results.multi_hand_landmarks[:2]:
                        mp_drawing.draw_landmarks(
                            frame_flipped,
                            hand_lms,
                            mp_hands.HAND_CONNECTIONS,
                        )
                        hands_pts.append([(lm.x, lm.y, lm.z) for lm in hand_lms.landmark])
                    try:
                        from backend.isl.extract_landmarks import extract_frame_features
                    except ImportError:
                        from extract_landmarks import extract_frame_features
                    feat = extract_frame_features(hands_pts)
                else:
                    feat = np.zeros(FEATURES_PER_FRAME, dtype=np.float32)

                rolling_buffer.append(feat)
                frame_counter += 1

                # Run prediction every 5 frames once 30 frames are buffered
                if len(rolling_buffer) == SEQUENCE_LENGTH and (frame_counter % 5 == 0):
                    seq_array = np.stack(list(rolling_buffer), axis=0)
                    last_result = predictor.predict_sequence(seq_array)

                # Render status overlay
                h, w, _ = frame_flipped.shape
                cv2.rectangle(frame_flipped, (0, 0), (w, 95), (25, 20, 35), -1)

                if len(rolling_buffer) < SEQUENCE_LENGTH:
                    status_text = f"Buffering frames: {len(rolling_buffer)}/{SEQUENCE_LENGTH}"
                    color = (0, 215, 255)
                elif last_result.get("recognized"):
                    status_text = (
                        f"PREDICTED: {last_result['sign']} "
                        f"({last_result['confidencePercent']:.1f}%)"
                    )
                    color = (80, 220, 100)
                else:
                    status_text = f"UNCERTAIN ({last_result.get('confidencePercent', 0.0):.1f}%)"
                    color = (120, 120, 240)

                cv2.putText(
                    frame_flipped,
                    status_text,
                    (16, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    color,
                    2,
                )
                cv2.putText(
                    frame_flipped,
                    "Assistive candidate only - requires user confirmation | Press 'Q' to quit",
                    (16, 74),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.48,
                    (210, 210, 210),
                    1,
                )

                cv2.imshow("SignMitra ISL Live Predictor", frame_flipped)
                if (cv2.waitKey(1) & 0xFF) in (ord("q"), ord("Q")):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run_webcam_prediction()

