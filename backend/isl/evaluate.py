"""
Evaluation Script for SignMitra Isolated-Sign ISL Recognition Model (V1).

Evaluates the trained Keras BiLSTM model (model/isl_lstm.keras) on the held-out
test split saved during training (dataset/processed/splits.json).

Reports:
- Test Accuracy
- Macro Precision, Macro Recall, Macro F1
- Per-class classification report
- Confusion Matrix (printed and saved to model/confusion_matrix.png)
- Explicit dataset size and signer-independence caveats
"""

import json
import sys
from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DATASET_DIR = BASE_DIR / "dataset" / "processed"
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "isl_lstm.keras"
LABELS_PATH = MODEL_DIR / "labels.json"
METADATA_PATH = MODEL_DIR / "model_metadata.json"
SPLITS_PATH = PROCESSED_DATASET_DIR / "splits.json"


def evaluate() -> None:
    try:
        import tensorflow as tf
        from sklearn.metrics import (
            accuracy_score,
            classification_report,
            confusion_matrix,
            precision_recall_fscore_support,
        )
    except ImportError as exc:
        print(
            f"[ERROR] Missing dependency ({exc}).\n"
            "Install requirements first: pip install -r backend/isl/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    if not MODEL_PATH.exists():
        print(
            f"[ERROR] Trained model not found at {MODEL_PATH}.\n"
            "Run `python train.py` after collecting and extracting real data.",
            file=sys.stderr,
        )
        sys.exit(1)

    from train import load_processed_dataset

    X, y, classes, _ = load_processed_dataset()

    if not SPLITS_PATH.exists():
        print(
            f"[ERROR] Data split file not found at {SPLITS_PATH}.\n"
            "Re-run `python train.py` to generate consistent train/val/test splits.",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(SPLITS_PATH, "r", encoding="utf-8") as f:
        splits = json.load(f)

    test_indices = np.asarray(splits["test_indices"], dtype=int)
    signer_independent = bool(splits.get("signer_independent", False))

    X_test = X[test_indices]
    y_test = y[test_indices]

    model = tf.keras.models.load_model(str(MODEL_PATH))
    probs = model.predict(X_test, verbose=0)
    y_pred = np.argmax(probs, axis=1)

    acc = float(accuracy_score(y_test, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    cm = confusion_matrix(y_test, y_pred, labels=list(range(len(classes))))
    cls_report = classification_report(
        y_test,
        y_pred,
        labels=list(range(len(classes))),
        target_names=classes,
        zero_division=0,
    )

    print("=" * 68)
    print("SIGNMITRA ISL BiLSTM EVALUATION REPORT (HELD-OUT TEST SET)")
    print("=" * 68)
    print(f"Test Set Size         : {len(y_test)} videos (out of {len(y)} total)")
    print(f"Signer-Independent    : {signer_independent}")
    print("-" * 68)
    print(f"Test Accuracy         : {acc * 100:.2f}% ({acc:.4f})")
    print(f"Macro Precision       : {float(precision):.4f}")
    print(f"Macro Recall          : {float(recall):.4f}")
    print(f"Macro F1 Score        : {float(f1):.4f}")
    print("-" * 68)
    print("Per-Class Classification Report:")
    print(cls_report)
    print("Confusion Matrix (rows = true class, cols = predicted class):")
    print(f"Classes: {classes}")
    print(cm)
    print("-" * 68)

    if len(y) < 150:
        print(
            "[DATASET WARNING] Total dataset size is small (< 150 samples).\n"
            "Do NOT interpret these metrics as production-grade or generalizable accuracy."
        )
    if not signer_independent:
        print(
            "[EVALUATION CAVEAT] Test split is NOT signer-independent.\n"
            "Collect multiple signers (e.g., signer_A .. signer_E) to evaluate cross-signer generalization."
        )
    print("=" * 68)

    # Save confusion matrix figure if matplotlib & seaborn are available
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(8, 6))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Purples",
            xticklabels=classes,
            yticklabels=classes,
        )
        plt.title("SignMitra ISL V1 - Test Confusion Matrix")
        plt.xlabel("Predicted Sign")
        plt.ylabel("True Sign")
        plt.tight_layout()
        cm_path = MODEL_DIR / "confusion_matrix.png"
        plt.savefig(cm_path, dpi=150)
        plt.close()
        print(f"[SAVED] Confusion matrix plot saved to: {cm_path.relative_to(BASE_DIR)}")
    except Exception as exc:
        print(f"[INFO] Could not save confusion matrix plot: {exc}")

    # Update model_metadata.json with measured metrics
    if METADATA_PATH.exists():
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
    else:
        meta = {"model": "isl-lstm-v1", "classes": classes}

    meta["lastEvaluation"] = {
        "testSamples": int(len(y_test)),
        "totalSamples": int(len(y)),
        "signerIndependent": signer_independent,
        "accuracy": round(acc, 4),
        "macroPrecision": round(float(precision), 4),
        "macroRecall": round(float(recall), 4),
        "macroF1": round(float(f1), 4),
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


if __name__ == "__main__":
    evaluate()

