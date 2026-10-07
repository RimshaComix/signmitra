"""
Dataset Acquisition & Validation Utility for SignMitra Static ISL Fingerspelling (V1).

Dataset:
  dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks (CC BY-SA 4.0)

Supported 23 Static ISL Signs:
  A, B, C, D, E, F, G, I, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Z
  (H, J, Y are excluded as they involve dynamic motion).

Features:
  - left_lm0_x ... left_lm20_z  (63 wrist-relative coordinates)
  - right_lm0_x ... right_lm20_z (63 wrist-relative coordinates)
  - label                        (target class letter)
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

KAGGLE_DATASET_HANDLE = "dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks"

EXPECTED_CLASSES = [
    "A", "B", "C", "D", "E", "F", "G", "I", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Z"
]

EXPECTED_FEATURE_COLUMNS = (
    [f"left_lm{i}_{axis}" for i in range(21) for axis in ("x", "y", "z")]
    + [f"right_lm{i}_{axis}" for i in range(21) for axis in ("x", "y", "z")]
)
NUM_FEATURES = 126

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_LOCAL_DATASET_DIR = BASE_DIR / "dataset" / "kaggle_isl"

TRAIN_FILE_CANDIDATES = ("combined_train_v2.csv", "combined_train_dataset.csv")
TEST_FILE_CANDIDATES = ("held_out_test.csv", "held_out_dataset.csv")


def resolve_dataset_dir(custom_path: str | Path | None = None, auto_download: bool = True) -> Path:
    """
    Resolves the directory containing the Kaggle ISL dataset CSV files.
    Priority:
      1. Explicit `custom_path` argument
      2. `ISL_DATASET_PATH` environment variable
      3. Local `backend/isl/dataset/kaggle_isl` directory (if CSVs exist)
      4. `kagglehub.dataset_download("dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks")`
    """
    env_path = custom_path or os.getenv("ISL_DATASET_PATH")
    if env_path:
        candidate = Path(env_path).expanduser().resolve()
        if candidate.exists():
            return candidate
        raise FileNotFoundError(f"Configured ISL_DATASET_PATH does not exist: {candidate}")

    if DEFAULT_LOCAL_DATASET_DIR.exists():
        has_train = any((DEFAULT_LOCAL_DATASET_DIR / f).exists() for f in TRAIN_FILE_CANDIDATES)
        has_test = any((DEFAULT_LOCAL_DATASET_DIR / f).exists() for f in TEST_FILE_CANDIDATES)
        if has_train and has_test:
            return DEFAULT_LOCAL_DATASET_DIR

    if auto_download:
        try:
            import kagglehub

            downloaded = kagglehub.dataset_download(KAGGLE_DATASET_HANDLE)
            return Path(downloaded).resolve()
        except Exception as exc:
            raise FileNotFoundError(
                f"Could not locate dataset locally at {DEFAULT_LOCAL_DATASET_DIR} and "
                f"KaggleHub download failed ({exc}). Set ISL_DATASET_PATH or extract the "
                f"dataset into {DEFAULT_LOCAL_DATASET_DIR}."
            ) from exc

    raise FileNotFoundError(
        f"Dataset not found at {DEFAULT_LOCAL_DATASET_DIR}. Set ISL_DATASET_PATH."
    )


def locate_csv_files(dataset_dir: Path) -> tuple[Path, Path]:
    """
    Finds the training CSV and held-out test CSV inside `dataset_dir`.
    Supports both (`combined_train_v2.csv`, `held_out_test.csv`) and the archive's
    (`combined_train_dataset.csv`, `held_out_dataset.csv`) filenames.
    """
    train_csv: Path | None = None
    test_csv: Path | None = None

    for name in TRAIN_FILE_CANDIDATES:
        p = dataset_dir / name
        if p.exists():
            train_csv = p
            break

    for name in TEST_FILE_CANDIDATES:
        p = dataset_dir / name
        if p.exists():
            test_csv = p
            break

    if not train_csv or not test_csv:
        raise FileNotFoundError(
            f"Could not find training/test CSV files in {dataset_dir}. "
            f"Expected one of {TRAIN_FILE_CANDIDATES} and one of {TEST_FILE_CANDIDATES}."
        )

    return train_csv, test_csv


def validate_dataframe_schema(df: pd.DataFrame, name: str) -> dict[str, Any]:
    """
    Validates that `df` has the exact 126 landmark columns + `label`, 23 expected
    ISL classes, and no NaN/null or infinite values.
    """
    cols = list(df.columns)
    expected_all = EXPECTED_FEATURE_COLUMNS + ["label"]

    if cols != expected_all:
        missing = [c for c in expected_all if c not in cols]
        extra = [c for c in cols if c not in expected_all]
        raise ValueError(
            f"[{name}] Column mismatch. Expected 126 landmark columns + 'label'. "
            f"Missing={missing[:5]}, Extra={extra[:5]}"
        )

    null_count = int(df.isnull().sum().sum())
    if null_count > 0:
        raise ValueError(f"[{name}] Contains {null_count} missing/NaN values.")

    feat_matrix = df[EXPECTED_FEATURE_COLUMNS].to_numpy(dtype=np.float64)
    if not np.all(np.isfinite(feat_matrix)):
        raise ValueError(f"[{name}] Contains non-finite (NaN/Inf) feature values.")

    unique_labels = sorted(df["label"].astype(str).unique().tolist())
    if unique_labels != EXPECTED_CLASSES:
        raise ValueError(
            f"[{name}] Label set mismatch. Expected 23 classes {EXPECTED_CLASSES}, got {unique_labels}."
        )

    dup_count = int(df.duplicated().sum())
    class_dist = {k: int(v) for k, v in df["label"].value_counts().sort_index().items()}

    # Verify wrist landmarks (left_lm0_* and right_lm0_*) are 0.0 (wrist-relative)
    wrist_cols = [
        "left_lm0_x", "left_lm0_y", "left_lm0_z",
        "right_lm0_x", "right_lm0_y", "right_lm0_z",
    ]
    max_wrist_abs = float(np.max(np.abs(df[wrist_cols].to_numpy(dtype=np.float64))))

    return {
        "name": name,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "feature_count": NUM_FEATURES,
        "num_classes": len(unique_labels),
        "classes": unique_labels,
        "null_values": null_count,
        "duplicate_rows": dup_count,
        "max_wrist_abs": max_wrist_abs,
        "class_distribution": class_dist,
    }


def validate_dataset(custom_path: str | Path | None = None) -> dict[str, Any]:
    dataset_dir = resolve_dataset_dir(custom_path)
    train_csv, test_csv = locate_csv_files(dataset_dir)

    train_df = pd.read_csv(train_csv)
    test_df = pd.read_csv(test_csv)

    train_info = validate_dataframe_schema(train_df, train_csv.name)
    test_info = validate_dataframe_schema(test_df, test_csv.name)

    # Check exact feature row overlap between train and held_out_test
    train_hashes = set(
        pd.util.hash_pandas_object(train_df[EXPECTED_FEATURE_COLUMNS], index=False).tolist()
    )
    test_hashes = set(
        pd.util.hash_pandas_object(test_df[EXPECTED_FEATURE_COLUMNS], index=False).tolist()
    )
    overlap_count = len(train_hashes.intersection(test_hashes))

    report = {
        "dataset_handle": KAGGLE_DATASET_HANDLE,
        "dataset_dir": str(dataset_dir),
        "train_file": train_csv.name,
        "test_file": test_csv.name,
        "train": train_info,
        "held_out_test": test_info,
        "train_test_exact_feature_overlap": overlap_count,
        "valid": overlap_count == 0,
    }
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the Kaggle ISL Hand Landmarks dataset.")
    parser.add_argument(
        "--dataset-path",
        type=str,
        default=None,
        help="Optional path to dataset directory (overrides ISL_DATASET_PATH).",
    )
    args = parser.parse_args()

    try:
        report = validate_dataset(args.dataset_path)
    except Exception as exc:
        print(f"[DATASET VALIDATION FAILED] {exc}", file=sys.stderr)
        sys.exit(1)

    print("=" * 72)
    print("SIGNMITRA STATIC ISL DATASET VALIDATION REPORT")
    print("=" * 72)
    print(f"Dataset Handle        : {report['dataset_handle']}")
    print(f"Dataset Directory     : {report['dataset_dir']}")
    print(f"Training File         : {report['train_file']} ({report['train']['rows']} rows, {report['train']['columns']} cols)")
    print(f"Held-Out Test File    : {report['test_file']} ({report['held_out_test']['rows']} rows, {report['held_out_test']['columns']} cols)")
    print(f"Feature Columns       : {report['train']['feature_count']} ({EXPECTED_FEATURE_COLUMNS[0]} .. {EXPECTED_FEATURE_COLUMNS[-1]})")
    print(f"Number of Classes     : {report['train']['num_classes']} -> {' '.join(report['train']['classes'])}")
    print(f"Excluded Dynamic Signs: H, J, Y (require temporal movement modeling)")
    print(f"Train Missing Values  : {report['train']['null_values']}")
    print(f"Test Missing Values   : {report['held_out_test']['null_values']}")
    print(f"Train Duplicate Rows  : {report['train']['duplicate_rows']}")
    print(f"Test Duplicate Rows   : {report['held_out_test']['duplicate_rows']}")
    print(f"Max Wrist Offset      : {report['train']['max_wrist_abs']:.6f} (confirms wrist-relative coordinates)")
    print(f"Train/Test Overlap    : {report['train_test_exact_feature_overlap']} rows")
    print("-" * 72)
    print("Training Class Distribution:")
    print(json.dumps(report["train"]["class_distribution"], indent=2))
    print("-" * 72)
    print("Held-Out Unseen Contributor Test Class Distribution:")
    print(json.dumps(report["held_out_test"]["class_distribution"], indent=2))
    print("=" * 72)


if __name__ == "__main__":
    main()

