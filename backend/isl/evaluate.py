"""
Evaluation Pipeline for SignMitra Static ISL Fingerspelling Classifier (V1).

Evaluates the trained model (`backend/isl/model/isl_static_classifier.keras`) and
fitted preprocessor (`backend/isl/model/scaler.pkl`) on:
  A. Validation Split (15% stratified contiguous block holdout from training CSV)
  B. Unseen Contributor Held-Out Test Set (`held_out_dataset.csv` / `held_out_test.csv`)

Generates:
  - Console classification report & confusion matrix
  - `backend/isl/model/evaluation_metrics.json`
  - `backend/isl/model/classification_report.txt`
  - `backend/isl/model/confusion_matrix.png`
  - Updates `backend/isl/model/model_metadata.json`
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

try:
    from backend.isl.preprocessing import ISLFeaturePreprocessor
    from backend.isl.train import (
        DEFAULT_MODEL_PATH,
        LABELS_PATH,
        METADATA_PATH,
        MODEL_DIR,
        SCALER_PATH,
        SPLITS_PATH,
        ISLStaticDenseNet,
    )
    from backend.isl.validate_dataset import (
        EXPECTED_CLASSES,
        EXPECTED_FEATURE_COLUMNS,
        locate_csv_files,
        resolve_dataset_dir,
    )
except ImportError:
    from preprocessing import ISLFeaturePreprocessor
    from train import (
        DEFAULT_MODEL_PATH,
        LABELS_PATH,
        METADATA_PATH,
        MODEL_DIR,
        SCALER_PATH,
        SPLITS_PATH,
        ISLStaticDenseNet,
    )
    from validate_dataset import (
        EXPECTED_CLASSES,
        EXPECTED_FEATURE_COLUMNS,
        locate_csv_files,
        resolve_dataset_dir,
    )

BASE_DIR = Path(__file__).resolve().parent
EVAL_METRICS_PATH = MODEL_DIR / "evaluation_metrics.json"
CLASSIFICATION_REPORT_PATH = MODEL_DIR / "classification_report.txt"
CONFUSION_MATRIX_PATH = MODEL_DIR / "confusion_matrix.png"


def compute_split_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    classes: list[str],
    split_name: str,
) -> tuple[dict[str, Any], str, np.ndarray]:
    acc = float(accuracy_score(y_true, y_pred))
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    per_p, per_r, per_f1, per_sup = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(len(classes))), average=None, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(classes))))
    report_str = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(classes))),
        target_names=classes,
        digits=4,
        zero_division=0,
    )

    per_class_metrics: dict[str, dict[str, float | int]] = {}
    for idx, cls_name in enumerate(classes):
        per_class_metrics[cls_name] = {
            "precision": round(float(per_p[idx]), 4),
            "recall": round(float(per_r[idx]), 4),
            "f1": round(float(per_f1[idx]), 4),
            "support": int(per_sup[idx]),
        }

    # Identify weakest classes by F1 score
    sorted_by_f1 = sorted(per_class_metrics.items(), key=lambda kv: kv[1]["f1"])
    weakest = [
        {"sign": k, **v}
        for k, v in sorted_by_f1[:5]
    ]

    summary = {
        "split": split_name,
        "samples": int(len(y_true)),
        "accuracy": round(acc, 4),
        "accuracy_percent": round(acc * 100.0, 2),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "macro_f1": round(float(macro_f1), 4),
        "per_class": per_class_metrics,
        "lowest_f1_classes": weakest,
        "confusion_matrix": cm.tolist(),
    }
    return summary, report_str, cm


def evaluate_model(dataset_path: str | Path | None = None) -> dict[str, Any]:
    model_path = Path(os.getenv("ISL_MODEL_PATH", str(DEFAULT_MODEL_PATH)))
    if not model_path.is_absolute():
        model_path = (BASE_DIR.parent.parent / model_path).resolve()
    if not model_path.exists() and DEFAULT_MODEL_PATH.exists():
        model_path = DEFAULT_MODEL_PATH

    if not model_path.exists() or not SCALER_PATH.exists():
        print(
            f"[ERROR] Trained model or scaler not found at {model_path} / {SCALER_PATH}.\n"
            "Run `python train.py` first.",
            file=sys.stderr,
        )
        sys.exit(1)

    model = ISLStaticDenseNet.load(model_path)
    preprocessor = ISLFeaturePreprocessor.load(SCALER_PATH)

    if LABELS_PATH.exists():
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            classes = json.load(f).get("classes", list(EXPECTED_CLASSES))
    else:
        classes = list(EXPECTED_CLASSES)

    label_to_idx = {c: i for i, c in enumerate(classes)}

    dataset_dir = resolve_dataset_dir(dataset_path)
    train_csv, test_csv = locate_csv_files(dataset_dir)

    train_df = pd.read_csv(train_csv)
    test_df = pd.read_csv(test_csv)

    # A. Load validation split indices saved during training
    if not SPLITS_PATH.exists():
        raise FileNotFoundError(f"Validation split file not found at {SPLITS_PATH}. Run train.py first.")
    with open(SPLITS_PATH, "r", encoding="utf-8") as f:
        split_data = json.load(f)
    val_indices = np.asarray(split_data["val_indices"], dtype=int)

    X_all_raw = train_df[EXPECTED_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    y_all = np.asarray([label_to_idx[str(lbl)] for lbl in train_df["label"]], dtype=np.int32)

    X_val_raw = X_all_raw[val_indices]
    y_val = y_all[val_indices]
    X_val = preprocessor.transform(X_val_raw)
    y_val_pred = model.predict(X_val)

    val_metrics, val_report_str, val_cm = compute_split_metrics(
        y_val, y_val_pred, classes, "validation_contiguous_block_holdout"
    )

    # B. Evaluate on Unseen Contributor Held-Out Test Set (held_out_dataset.csv)
    X_test_raw = test_df[EXPECTED_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    y_test = np.asarray([label_to_idx[str(lbl)] for lbl in test_df["label"]], dtype=np.int32)
    X_test = preprocessor.transform(X_test_raw)
    y_test_pred = model.predict(X_test)

    test_metrics, test_report_str, test_cm = compute_split_metrics(
        y_test, y_test_pred, classes, "held_out_unseen_contributor_test"
    )

    print("=" * 76)
    print("SIGNMITRA STATIC ISL V1 — EVALUATION REPORT")
    print("=" * 76)
    print("A. VALIDATION SET PERFORMANCE (15% Contiguous Block Holdout from Train CSV)")
    print(f"   Samples         : {val_metrics['samples']}")
    print(f"   Accuracy        : {val_metrics['accuracy_percent']:.2f}% ({val_metrics['accuracy']:.4f})")
    print(f"   Macro Precision : {val_metrics['macro_precision']:.4f}")
    print(f"   Macro Recall    : {val_metrics['macro_recall']:.4f}")
    print(f"   Macro F1        : {val_metrics['macro_f1']:.4f}")
    print("-" * 76)
    print("B. UNSEEN CONTRIBUTOR HELD-OUT TEST PERFORMANCE (PRIMARY GENERALIZATION METRIC)")
    print(f"   Test File       : {test_csv.name} ({test_metrics['samples']} samples)")
    print(f"   Accuracy        : {test_metrics['accuracy_percent']:.2f}% ({test_metrics['accuracy']:.4f})")
    print(f"   Macro Precision : {test_metrics['macro_precision']:.4f}")
    print(f"   Macro Recall    : {test_metrics['macro_recall']:.4f}")
    print(f"   Macro F1        : {test_metrics['macro_f1']:.4f}")
    print("-" * 76)
    print("Per-Class Classification Report (Held-Out Unseen Contributor Test Set):")
    print(test_report_str)
    print("Lowest F1 Classes on Unseen Contributor:")
    for item in test_metrics["lowest_f1_classes"]:
        print(
            f"   Sign '{item['sign']}': F1={item['f1']:.4f} "
            f"(Precision={item['precision']:.4f}, Recall={item['recall']:.4f}, Support={item['support']})"
        )
    print("=" * 76)

    # Save classification report text
    full_report_txt = (
        "============================================================================\n"
        "SIGNMITRA STATIC ISL V1 — CLASSIFICATION REPORT\n"
        "============================================================================\n\n"
        "1. VALIDATION SET (15% Contiguous Block Holdout)\n"
        f"Accuracy: {val_metrics['accuracy_percent']:.2f}% | Macro F1: {val_metrics['macro_f1']:.4f}\n\n"
        f"{val_report_str}\n"
        "----------------------------------------------------------------------------\n"
        "2. HELD-OUT UNSEEN CONTRIBUTOR TEST SET (PRIMARY METRIC)\n"
        f"Accuracy: {test_metrics['accuracy_percent']:.2f}% | Macro F1: {test_metrics['macro_f1']:.4f}\n\n"
        f"{test_report_str}\n"
    )
    with open(CLASSIFICATION_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(full_report_txt)

    # Save confusion matrix figure
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns

        fig, axes = plt.subplots(1, 2, figsize=(18, 7.5))

        sns.heatmap(
            val_cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=classes,
            yticklabels=classes,
            ax=axes[0],
            cbar=False,
        )
        axes[0].set_title(
            f"Validation Set Confusion Matrix\nAcc: {val_metrics['accuracy_percent']:.2f}% | Macro F1: {val_metrics['macro_f1']:.4f}"
        )
        axes[0].set_xlabel("Predicted Sign")
        axes[0].set_ylabel("True Sign")

        sns.heatmap(
            test_cm,
            annot=True,
            fmt="d",
            cmap="Purples",
            xticklabels=classes,
            yticklabels=classes,
            ax=axes[1],
            cbar=False,
        )
        axes[1].set_title(
            f"Unseen Contributor Held-Out Test Confusion Matrix\nAcc: {test_metrics['accuracy_percent']:.2f}% | Macro F1: {test_metrics['macro_f1']:.4f}"
        )
        axes[1].set_xlabel("Predicted Sign")
        axes[1].set_ylabel("True Sign")

        plt.tight_layout()
        plt.savefig(CONFUSION_MATRIX_PATH, dpi=160)
        plt.close(fig)
        print(f"[SAVED] Confusion matrix image : {CONFUSION_MATRIX_PATH.relative_to(BASE_DIR)}")
    except Exception as exc:
        print(f"[WARNING] Could not render confusion matrix PNG: {exc}")

    combined_output = {
        "model": "isl-static-v1",
        "classes": classes,
        "validation": val_metrics,
        "held_out_test": test_metrics,
    }
    with open(EVAL_METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(combined_output, f, indent=2)
    print(f"[SAVED] Evaluation JSON metrics: {EVAL_METRICS_PATH.relative_to(BASE_DIR)}")
    print(f"[SAVED] Classification report  : {CLASSIFICATION_REPORT_PATH.relative_to(BASE_DIR)}")

    # Update model_metadata.json with real measured metrics
    if METADATA_PATH.exists():
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
    else:
        meta = {"model_name": "ISL Static V1", "model_id": "isl-static-v1"}

    meta["validation_metrics"] = {
        "samples": val_metrics["samples"],
        "accuracy": val_metrics["accuracy"],
        "macro_precision": val_metrics["macro_precision"],
        "macro_recall": val_metrics["macro_recall"],
        "macro_f1": val_metrics["macro_f1"],
    }
    meta["held_out_test_metrics"] = {
        "samples": test_metrics["samples"],
        "accuracy": test_metrics["accuracy"],
        "macro_precision": test_metrics["macro_precision"],
        "macro_recall": test_metrics["macro_recall"],
        "macro_f1": test_metrics["macro_f1"],
        "lowest_f1_classes": test_metrics["lowest_f1_classes"],
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return combined_output


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate SignMitra Static ISL V1 Classifier.")
    parser.add_argument("--dataset-path", type=str, default=None, help="Path to Kaggle ISL dataset directory.")
    args = parser.parse_args()
    evaluate_model(args.dataset_path)


if __name__ == "__main__":
    main()
