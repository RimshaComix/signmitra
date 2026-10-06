"""
MediaPipe Hand Landmark Extraction & Normalization for SignMitra ISL (V1).

Converts raw video files from dataset/raw/ into normalized (30, 126) temporal
feature sequences saved as .npy files in dataset/processed/, along with a
structured metadata.json manifest.

Feature representation (126 floats per frame):
- Up to 2 hands detected per frame (sorted left-to-right by wrist x-coordinate).
- 21 landmarks per hand, each (x, y, z).
- Wrist-relative translation: subtract landmark 0 (wrist) from all 21 landmarks.
- Scale normalization: divide by max Euclidean distance from wrist (if > 1e-6).
- If 1 hand is detected: first 63 features populated, second 63 features zero-filled.
- If 0 hands are detected: all 126 features zero-filled.

This exact mathematical normalization is mirrored in the browser MediaPipe JS pipeline.
"""

import json
import math
import sys
from pathlib import Path
from typing import Any

import numpy as np

SIGNS = [
    "HELLO",
    "THANK_YOU",
    "HELP",
    "DOCTOR",
    "WHERE",
    "WATER",
]

SEQUENCE_LENGTH = 30
NUM_LANDMARKS_PER_HAND = 21
COORDS_PER_LANDMARK = 3
FEATURES_PER_HAND = NUM_LANDMARKS_PER_HAND * COORDS_PER_LANDMARK  # 63
FEATURES_PER_FRAME = FEATURES_PER_HAND * 2  # 126

BASE_DIR = Path(__file__).resolve().parent
RAW_DATASET_DIR = BASE_DIR / "dataset" / "raw"
PROCESSED_DATASET_DIR = BASE_DIR / "dataset" / "processed"


def normalize_single_hand(landmarks_xyz: list[tuple[float, float, float]] | np.ndarray) -> np.ndarray:
    """
    Normalizes 21 hand landmarks [(x, y, z), ...] relative to the wrist (landmark 0)
    and scales by the maximum Euclidean distance from the wrist.
    Returns a 1D float32 array of shape (63,).
    """
    pts = np.asarray(landmarks_xyz, dtype=np.float32)
    if pts.shape != (NUM_LANDMARKS_PER_HAND, COORDS_PER_LANDMARK):
        raise ValueError(
            f"Expected hand landmarks shape ({NUM_LANDMARKS_PER_HAND}, {COORDS_PER_LANDMARK}), got {pts.shape}"
        )

    wrist = pts[0].copy()
    relative = pts - wrist  # wrist becomes (0, 0, 0)

    distances = np.linalg.norm(relative, axis=1)
    max_dist = float(np.max(distances))
    if max_dist > 1e-6:
        relative = relative / max_dist

    return relative.reshape(FEATURES_PER_HAND).astype(np.float32)


def extract_frame_features(
    hands_landmarks: list[list[tuple[float, float, float]]] | None,
) -> np.ndarray:
    """
    Converts a list of detected hands (each a list of 21 (x, y, z) tuples)
    into a deterministic 126-element feature vector.
    - Hands are sorted by wrist x-coordinate (ascending) for consistent ordering.
    - If 1 hand is present: occupies indices [0:63], indices [63:126] are 0.0.
    - If 0 hands are present: all 126 values are 0.0.
    """
    frame_vec = np.zeros(FEATURES_PER_FRAME, dtype=np.float32)
    if not hands_landmarks:
        return frame_vec

    # Sort detected hands by wrist x-coordinate so two-hand ordering is deterministic
    sorted_hands = sorted(hands_landmarks[:2], key=lambda h: float(h[0][0]))

    for hand_idx, hand_pts in enumerate(sorted_hands[:2]):
        norm_hand = normalize_single_hand(hand_pts)
        start = hand_idx * FEATURES_PER_HAND
        frame_vec[start : start + FEATURES_PER_HAND] = norm_hand

    return frame_vec


def resample_or_pad_sequence(
    frames: list[np.ndarray] | np.ndarray,
    sequence_length: int = SEQUENCE_LENGTH,
) -> np.ndarray:
    """
    Converts a variable-length list of 126-feature frame vectors into a fixed
    (sequence_length, 126) float32 array:
    - If len(frames) == 0: returns zeros of shape (sequence_length, 126)
    - If len(frames) < sequence_length: zero-pads at the end to sequence_length
    - If len(frames) > sequence_length: uniformly resamples across time to sequence_length
    """
    if len(frames) == 0:
        return np.zeros((sequence_length, FEATURES_PER_FRAME), dtype=np.float32)

    arr = np.asarray(frames, dtype=np.float32)
    if arr.ndim != 2 or arr.shape[1] != FEATURES_PER_FRAME:
        raise ValueError(f"Expected frames of shape (N, {FEATURES_PER_FRAME}), got {arr.shape}")

    num_frames = arr.shape[0]
    if num_frames == sequence_length:
        return arr
    elif num_frames < sequence_length:
        padded = np.zeros((sequence_length, FEATURES_PER_FRAME), dtype=np.float32)
        padded[:num_frames] = arr
        return padded
    else:
        indices = np.linspace(0, num_frames - 1, sequence_length, dtype=int)
        return arr[indices]


def extract_mediapipe_hands_from_frame(rgb_frame: np.ndarray, hands_detector: Any) -> np.ndarray:
    """
    Runs MediaPipe Hands on an RGB image frame and returns the 126-feature vector.
    """
    results = hands_detector.process(rgb_frame)
    if not results.multi_hand_landmarks:
        return np.zeros(FEATURES_PER_FRAME, dtype=np.float32)

    hands_list: list[list[tuple[float, float, float]]] = []
    for hand_lms in results.multi_hand_landmarks[:2]:
        pts = [(lm.x, lm.y, lm.z) for lm in hand_lms.landmark]
        hands_list.append(pts)

    return extract_frame_features(hands_list)


def discover_raw_videos(raw_dir: Path) -> list[dict[str, Any]]:
    """
    Discovers .mp4/.avi/.mov/.webm videos under raw_dir.
    Supports both:
      1) dataset/raw/<SIGN>/<video>.mp4
      2) dataset/raw/<signer>/<SIGN>/<video>.mp4
    """
    video_extensions = {".mp4", ".avi", ".mov", ".webm"}
    discovered: list[dict[str, Any]] = []

    if not raw_dir.exists():
        return discovered

    # Case 1: Direct sign folders dataset/raw/<SIGN>/*
    for sign_idx, sign in enumerate(SIGNS):
        sign_folder = raw_dir / sign
        if sign_folder.is_dir():
            for vid_path in sorted(sign_folder.iterdir()):
                if vid_path.is_file() and vid_path.suffix.lower() in video_extensions:
                    discovered.append(
                        {
                            "video_path": vid_path,
                            "label": sign,
                            "label_index": sign_idx,
                            "signer": None,
                        }
                    )

    # Case 2: Signer subdirectories dataset/raw/<signer>/<SIGN>/*
    for subdir in sorted(raw_dir.iterdir()):
        if not subdir.is_dir() or subdir.name in SIGNS:
            continue
        signer_id = subdir.name
        for sign_idx, sign in enumerate(SIGNS):
            sign_folder = subdir / sign
            if sign_folder.is_dir():
                for vid_path in sorted(sign_folder.iterdir()):
                    if vid_path.is_file() and vid_path.suffix.lower() in video_extensions:
                        discovered.append(
                            {
                                "video_path": vid_path,
                                "label": sign,
                                "label_index": sign_idx,
                                "signer": signer_id,
                            }
                        )

    return discovered


def process_dataset() -> None:
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

    videos = discover_raw_videos(RAW_DATASET_DIR)
    if not videos:
        print(
            f"[WARNING] No raw training videos found in {RAW_DATASET_DIR}.\n"
            "Run `python collect_data.py` first to record real webcam sign videos."
        )
        return

    PROCESSED_DATASET_DIR.mkdir(parents=True, exist_ok=True)
    sequences_dir = PROCESSED_DATASET_DIR / "sequences"
    sequences_dir.mkdir(parents=True, exist_ok=True)

    mp_hands = mp.solutions.hands
    metadata_records: list[dict[str, Any]] = []
    skipped_empty_videos = 0

    print("=" * 68)
    print(f"EXTRACTING MEDIAPIPE HAND LANDMARKS ({len(videos)} videos found)")
    print(f"Sequence shape per sample: ({SEQUENCE_LENGTH}, {FEATURES_PER_FRAME})")
    print("=" * 68)

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as hands_detector:
        for idx, item in enumerate(videos, start=1):
            vid_path: Path = item["video_path"]
            label: str = item["label"]
            label_index: int = item["label_index"]
            signer: str | None = item["signer"]

            cap = cv2.VideoCapture(str(vid_path))
            if not cap.isOpened():
                print(f"  [SKIP] Could not open video: {vid_path}")
                continue

            raw_frames_features: list[np.ndarray] = []
            frames_with_hands = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                # Flip horizontally to match selfie/webcam mirror orientation used in collect_data & browser
                frame_flipped = cv2.flip(frame, 1)
                rgb = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
                feat = extract_mediapipe_hands_from_frame(rgb, hands_detector)
                if np.any(feat != 0.0):
                    frames_with_hands += 1
                raw_frames_features.append(feat)

            cap.release()

            # Do NOT silently treat videos with zero detected hands as valid training samples
            if frames_with_hands == 0:
                skipped_empty_videos += 1
                print(
                    f"  [SKIP - NO HANDS DETECTED] {vid_path.name}: "
                    "0 frames contained detectable hands."
                )
                continue

            sequence = resample_or_pad_sequence(raw_frames_features, SEQUENCE_LENGTH)
            assert sequence.shape == (SEQUENCE_LENGTH, FEATURES_PER_FRAME)

            signer_prefix = f"{signer}_" if signer else ""
            out_name = f"{label}_{signer_prefix}{vid_path.stem}_{idx:04d}.npy"
            out_path = sequences_dir / out_name
            np.save(out_path, sequence)

            metadata_records.append(
                {
                    "file": f"sequences/{out_name}",
                    "source_video": str(vid_path.relative_to(BASE_DIR)),
                    "label": label,
                    "label_index": label_index,
                    "signer": signer,
                    "total_frames": len(raw_frames_features),
                    "frames_with_hands": frames_with_hands,
                }
            )

            print(
                f"  [{idx}/{len(videos)}] Saved {out_name} | "
                f"label={label} | signer={signer or 'unspecified'} | "
                f"hand_frames={frames_with_hands}/{len(raw_frames_features)}"
            )

    manifest = {
        "sequence_length": SEQUENCE_LENGTH,
        "features_per_frame": FEATURES_PER_FRAME,
        "classes": SIGNS,
        "total_samples": len(metadata_records),
        "skipped_no_hand_videos": skipped_empty_videos,
        "samples": metadata_records,
    }

    manifest_path = PROCESSED_DATASET_DIR / "metadata.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("=" * 68)
    print(f"Extraction Complete: {len(metadata_records)} sequences saved.")
    if skipped_empty_videos > 0:
        print(f"Skipped {skipped_empty_videos} videos where no hands were detected.")
    print(f"Metadata manifest written to: {manifest_path.relative_to(BASE_DIR)}")
    print("=" * 68)


if __name__ == "__main__":
    process_dataset()

