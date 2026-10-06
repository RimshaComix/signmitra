"""
Real Webcam Video Collector for SignMitra Isolated-Sign ISL Recognition (V1).

Records genuine webcam videos for the 6 target signs:
HELLO, THANK_YOU, HELP, DOCTOR, WHERE, WATER.

Never generates synthetic or fake training samples.
Supports both flat structure (dataset/raw/<SIGN>/) and signer-aware structure
(dataset/raw/<signer_id>/<SIGN>/) for signer-independent train/test splitting.
"""

import argparse
import os
import sys
import time
from pathlib import Path

SIGNS = [
    "HELLO",
    "THANK_YOU",
    "HELP",
    "DOCTOR",
    "WHERE",
    "WATER",
]

BASE_DIR = Path(__file__).resolve().parent
RAW_DATASET_DIR = BASE_DIR / "dataset" / "raw"

DEFAULT_VIDEOS_PER_SIGN = 50
DEFAULT_DURATION_SECONDS = 3.0
DEFAULT_FPS = 30
COUNTDOWN_SECONDS = 3


def collect_videos(
    signer: str = "",
    signs: list[str] | None = None,
    videos_per_sign: int = DEFAULT_VIDEOS_PER_SIGN,
    duration_sec: float = DEFAULT_DURATION_SECONDS,
    camera_index: int = 0,
) -> None:
    try:
        import cv2
    except ImportError:
        print(
            "[ERROR] OpenCV (opencv-python) is not installed.\n"
            "Install requirements first: pip install -r backend/isl/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    target_signs = signs if signs else SIGNS
    for s in target_signs:
        if s not in SIGNS:
            raise ValueError(f"Unsupported sign '{s}'. Allowed signs: {SIGNS}")

    print("=" * 68)
    print("SIGNMITRA ISL REAL WEBCAM DATASET COLLECTOR (V1)")
    print("=" * 68)
    print("NOTICE: This utility records REAL webcam video samples for training.")
    print("No synthetic or simulated samples are generated.")
    print(f"Target vocabulary ({len(target_signs)} signs): {', '.join(target_signs)}")
    print(f"Videos per sign: {videos_per_sign} | Clip duration: {duration_sec:.1f}s")
    if signer:
        print(f"Signer ID: {signer} (Signer-aware directory organization active)")
    else:
        print(
            "Signer ID: Not specified (Saving to dataset/raw/<SIGN>/).\n"
            "TIP: Pass --signer signer_A to organize multiple signers for\n"
            "     signer-independent evaluation."
        )
    print("Controls: Press 'Q' at any time in the camera window to quit.")
    print("=" * 68)

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(
            f"[ERROR] Could not open webcam at index {camera_index}. "
            "Ensure a real camera is connected and not in use by another app.",
            file=sys.stderr,
        )
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, DEFAULT_FPS)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 1 or fps > 120:
        fps = float(DEFAULT_FPS)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    try:
        for sign in target_signs:
            if signer:
                sign_dir = RAW_DATASET_DIR / signer / sign
            else:
                sign_dir = RAW_DATASET_DIR / sign
            sign_dir.mkdir(parents=True, exist_ok=True)

            existing_clips = sorted(sign_dir.glob("*.mp4"))
            start_idx = len(existing_clips) + 1

            print(f"\n---> Preparing to record sign: {sign} ({videos_per_sign} videos)")

            for vid_num in range(start_idx, start_idx + videos_per_sign):
                prefix = f"{sign}_{signer}" if signer else sign
                filename = f"{prefix}_{vid_num:03d}.mp4"
                filepath = sign_dir / filename

                # Preparation countdown
                countdown_start = time.time()
                while True:
                    elapsed = time.time() - countdown_start
                    remaining = COUNTDOWN_SECONDS - elapsed
                    if remaining <= 0:
                        break

                    ret, frame = cap.read()
                    if not ret:
                        print("[ERROR] Failed to read frame from webcam.", file=sys.stderr)
                        return

                    display = cv2.flip(frame, 1)
                    cv2.rectangle(display, (0, 0), (width, 110), (30, 20, 40), -1)
                    cv2.putText(
                        display,
                        f"REAL TRAINING CAPTURE | SIGN: {sign}",
                        (16, 32),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 255),
                        2,
                    )
                    cv2.putText(
                        display,
                        f"Clip {vid_num} of {start_idx + videos_per_sign - 1} | Get Ready: {int(remaining) + 1}s",
                        (16, 68),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.65,
                        (0, 215, 255),
                        2,
                    )
                    cv2.putText(
                        display,
                        "Press 'Q' to quit",
                        (16, 96),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (200, 200, 200),
                        1,
                    )

                    cv2.imshow("SignMitra ISL Dataset Collector", display)
                    if (cv2.waitKey(1) & 0xFF) in (ord("q"), ord("Q")):
                        print("\n[INFO] Collection stopped by user (Q pressed).")
                        return

                # Active video recording
                writer = cv2.VideoWriter(str(filepath), fourcc, fps, (width, height))
                rec_start = time.time()
                frames_written = 0

                while (time.time() - rec_start) < duration_sec:
                    ret, frame = cap.read()
                    if not ret:
                        break

                    writer.write(frame)
                    frames_written += 1

                    display = cv2.flip(frame, 1)
                    rec_elapsed = time.time() - rec_start
                    cv2.rectangle(display, (0, 0), (width, 95), (20, 20, 140), -1)
                    cv2.putText(
                        display,
                        f"RECORDING SIGN: {sign} ({rec_elapsed:.1f}s / {duration_sec:.1f}s)",
                        (16, 36),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.68,
                        (255, 255, 255),
                        2,
                    )
                    cv2.putText(
                        display,
                        f"Saving: {filename} | Press 'Q' to abort",
                        (16, 72),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.52,
                        (230, 230, 230),
                        1,
                    )

                    cv2.imshow("SignMitra ISL Dataset Collector", display)
                    if (cv2.waitKey(1) & 0xFF) in (ord("q"), ord("Q")):
                        writer.release()
                        if filepath.exists():
                            filepath.unlink()
                        print("\n[INFO] Collection aborted by user (Q pressed).")
                        return

                writer.release()
                print(f"  [SAVED] {filepath.relative_to(BASE_DIR)} ({frames_written} frames)")

        print("\n[COMPLETE] All requested real training videos have been recorded.")

    finally:
        cap.release()
        cv2.destroyAllWindows()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Record real webcam training videos for SignMitra ISL isolated-sign recognition."
    )
    parser.add_argument(
        "--signer",
        type=str,
        default="",
        help="Optional signer identifier (e.g., signer_A) for signer-aware dataset splitting.",
    )
    parser.add_argument(
        "--sign",
        type=str,
        default="",
        help="Optional single sign to record (HELLO, THANK_YOU, HELP, DOCTOR, WHERE, WATER).",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=DEFAULT_VIDEOS_PER_SIGN,
        help=f"Number of videos to record per sign (default: {DEFAULT_VIDEOS_PER_SIGN}).",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=DEFAULT_DURATION_SECONDS,
        help=f"Duration in seconds per video (default: {DEFAULT_DURATION_SECONDS}).",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Webcam device index (default: 0).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    selected_signs = [args.sign.strip().upper()] if args.sign.strip() else SIGNS
    collect_videos(
        signer=args.signer.strip(),
        signs=selected_signs,
        videos_per_sign=args.count,
        duration_sec=args.duration,
        camera_index=args.camera,
    )

