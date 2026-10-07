"""
Shared Feature Preprocessing Module for SignMitra Static ISL Fingerspelling (V1).

Used identically by:
  - `train.py`    (fit on training split ONLY, transform train & validation)
  - `evaluate.py` (load saved `scaler.pkl`, transform validation & unseen held-out test set)
  - `predict.py` & `app.py` (load saved `scaler.pkl`, transform live 126-feature webcam vectors)

Feature Representation (126 floats):
  - Indices [0:63]   : Left hand 21 landmarks (x, y, z), wrist-relative (left_lm0 = 0,0,0).
                       63 zeros if left hand is not detected.
  - Indices [63:126] : Right hand 21 landmarks (x, y, z), wrist-relative (right_lm0 = 0,0,0).
                       63 zeros if right hand is not detected.
  - Scale Invariance : After wrist-relative subtraction, calculates the global spatial
                       distance between Landmark 0 (Wrist) and Landmark 9 (Middle finger
                       MCP joint) on the active hand and divides every (x, y, z) coordinate
                       in the 126-element array by this distance scale factor.
"""

from pathlib import Path

import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler

NUM_LANDMARKS_PER_HAND = 21
COORDS_PER_LANDMARK = 3
FEATURES_PER_HAND = NUM_LANDMARKS_PER_HAND * COORDS_PER_LANDMARK  # 63
NUM_FEATURES = FEATURES_PER_HAND * 2  # 126
WRIST_LANDMARK_INDEX = 0
MIDDLE_MCP_LANDMARK_INDEX = 9


def hand_to_wrist_relative(landmarks_xyz: list[tuple[float, float, float]] | np.ndarray | None) -> np.ndarray:
    """
    Converts 21 (x, y, z) landmarks of a single hand into 63 wrist-relative floats
    (subtracting Landmark 0, the wrist, as the origin).
    If `landmarks_xyz` is None or all zeros, returns 63 zeros.
    """
    if landmarks_xyz is None:
        return np.zeros(FEATURES_PER_HAND, dtype=np.float32)

    pts = np.asarray(landmarks_xyz, dtype=np.float32).reshape(NUM_LANDMARKS_PER_HAND, COORDS_PER_LANDMARK)
    if not np.any(np.abs(pts) > 1e-8):
        return np.zeros(FEATURES_PER_HAND, dtype=np.float32)

    wrist = pts[WRIST_LANDMARK_INDEX : WRIST_LANDMARK_INDEX + 1, :]  # (1, 3)
    rel = pts - wrist
    return rel.reshape(FEATURES_PER_HAND).astype(np.float32)


def extract_126_features(
    left_hand_landmarks: list[tuple[float, float, float]] | np.ndarray | None = None,
    right_hand_landmarks: list[tuple[float, float, float]] | np.ndarray | None = None,
) -> np.ndarray:
    """
    Constructs the 126-element feature vector [left_63, right_63] from optional
    left and right hand landmark arrays, applies wrist-relative subtraction, and
    normalizes all 126 coordinates by the global spatial distance between
    Landmark 0 (Wrist) and Landmark 9 (Middle finger MCP joint) on the active hand.
    Missing hands remain 63 zeros.
    """
    vec = np.zeros(NUM_FEATURES, dtype=np.float32)
    if left_hand_landmarks is not None:
        vec[:FEATURES_PER_HAND] = hand_to_wrist_relative(left_hand_landmarks)
    if right_hand_landmarks is not None:
        vec[FEATURES_PER_HAND:] = hand_to_wrist_relative(right_hand_landmarks)

    # Enforce single-hand dataset alignment: if only left slot is populated while right slot is zero,
    # swap channels so a single active hand populates indices [63:126].
    left_active = np.any(np.abs(vec[:FEATURES_PER_HAND]) > 1e-8)
    right_active = np.any(np.abs(vec[FEATURES_PER_HAND:]) > 1e-8)
    if left_active and not right_active:
        vec[FEATURES_PER_HAND:] = vec[:FEATURES_PER_HAND]
        vec[:FEATURES_PER_HAND] = 0.0

    return ensure_wrist_relative_batch(vec.reshape(1, NUM_FEATURES))[0]


def ensure_wrist_relative_batch(X: np.ndarray) -> np.ndarray:
    """
    Ensures every sample in `X` (shape (N, 126)) has:
      1. Wrist-relative coordinates for both left hand [0:63] and right hand [63:126]
         (Landmark 0 as the origin).
      2. Global distance scale normalization: calculates the spatial Euclidean distance
         between Landmark 0 (Wrist) and Landmark 9 (Middle finger MCP joint) on the
         active hand and divides every single tracking (x, y, z) coordinate array value
         by this distance scale factor.
      3. All-zero missing-hand slots preserved as exact zeros.
    """
    arr = np.asarray(X, dtype=np.float32)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    if arr.shape[1] != NUM_FEATURES:
        raise ValueError(f"Expected {NUM_FEATURES} features, got shape {arr.shape}.")
    if not np.all(np.isfinite(arr)):
        raise ValueError("Input features contain NaN or infinite values.")

    out = arr.copy()

    # Left hand: [0:63] -> (N, 21, 3)
    left = out[:, :FEATURES_PER_HAND].reshape(-1, NUM_LANDMARKS_PER_HAND, COORDS_PER_LANDMARK)
    left_active = np.any(np.abs(left) > 1e-8, axis=(1, 2))
    if np.any(left_active):
        left_wrists = left[left_active, WRIST_LANDMARK_INDEX : WRIST_LANDMARK_INDEX + 1, :]
        left[left_active] = left[left_active] - left_wrists

    # Right hand: [63:126] -> (N, 21, 3)
    right = out[:, FEATURES_PER_HAND:].reshape(-1, NUM_LANDMARKS_PER_HAND, COORDS_PER_LANDMARK)
    right_active = np.any(np.abs(right) > 1e-8, axis=(1, 2))
    if np.any(right_active):
        right_wrists = right[right_active, WRIST_LANDMARK_INDEX : WRIST_LANDMARK_INDEX + 1, :]
        right[right_active] = right[right_active] - right_wrists

    # Global spatial distance between Landmark 0 (Wrist, now 0,0,0) and Landmark 9 (Middle MCP)
    # on the active hand (using the primary active hand's d(0,9), or max active d(0,9) when both present)
    dist_right_0_9 = np.linalg.norm(right[:, MIDDLE_MCP_LANDMARK_INDEX, :], axis=1)
    dist_left_0_9 = np.linalg.norm(left[:, MIDDLE_MCP_LANDMARK_INDEX, :], axis=1)

    global_scale = np.where(
        right_active & left_active,
        np.maximum(dist_right_0_9, dist_left_0_9),
        np.where(right_active, dist_right_0_9, np.where(left_active, dist_left_0_9, 1.0)),
    )
    global_scale = np.where(global_scale > 1e-6, global_scale, 1.0).astype(np.float32)

    out[:, :FEATURES_PER_HAND] = left.reshape(-1, FEATURES_PER_HAND)
    out[:, FEATURES_PER_HAND:] = right.reshape(-1, FEATURES_PER_HAND)

    # Divide every single tracking (x, y, z) coordinate array value by the global distance scale factor
    out = out / global_scale[:, np.newaxis]
    return out.astype(np.float32)


class ISLFeaturePreprocessor:
    """
    Reusable feature preprocessor shared by training, evaluation, and live inference.
    Fits a StandardScaler strictly on wrist-relative, scale-normalized training data
    and applies identical wrist-relative + Landmark 0-to-9 global distance scale
    normalization + z-score standardization during evaluation and inference.
    """

    def __init__(self, scaler: StandardScaler | None = None) -> None:
        self.scaler: StandardScaler = scaler if scaler is not None else StandardScaler()
        self.is_fitted: bool = scaler is not None and hasattr(scaler, "mean_")

    def fit(self, X_train: np.ndarray) -> "ISLFeaturePreprocessor":
        clean = ensure_wrist_relative_batch(X_train)
        self.scaler.fit(clean)
        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("ISLFeaturePreprocessor has not been fitted or loaded yet.")
        clean = ensure_wrist_relative_batch(X)
        return self.scaler.transform(clean).astype(np.float32)

    def fit_transform(self, X_train: np.ndarray) -> np.ndarray:
        self.fit(X_train)
        return self.transform(X_train)

    def save(self, path: str | Path) -> None:
        if not self.is_fitted:
            raise RuntimeError("Cannot save an unfitted ISLFeaturePreprocessor.")
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.scaler, target)

    @classmethod
    def load(cls, path: str | Path) -> "ISLFeaturePreprocessor":
        target = Path(path)
        if not target.exists():
            raise FileNotFoundError(f"Scaler artifact not found at {target}")
        loaded_scaler = joblib.load(target)
        return cls(scaler=loaded_scaler)

