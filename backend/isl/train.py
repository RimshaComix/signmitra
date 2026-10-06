"""
Real Keras BiLSTM Model Training Script for SignMitra Isolated-Sign ISL Recognition (V1).

Architecture:
  Input(shape=(30, 126))
  -> Masking(mask_value=0.0)
  -> Bidirectional(LSTM(128, return_sequences=True))
  -> Dropout(0.3)
  -> Bidirectional(LSTM(64))
  -> Dropout(0.3)
  -> Dense(64, activation='relu')
  -> Dropout(0.2)
  -> Dense(num_classes, activation='softmax')

Data Splitting:
- Video-level splitting only (never splits frames from the same video across train/test).
- If multiple signers (>= 3) are present in metadata.json, performs signer-independent
  splitting so test signers do not appear in training.
- Otherwise, performs stratified video-level splitting and explicitly logs that the
  evaluation is not signer-independent.
"""

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np

BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DATASET_DIR = BASE_DIR / "dataset" / "processed"
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "isl_lstm.keras"
LABELS_PATH = MODEL_DIR / "labels.json"
METADATA_PATH = MODEL_DIR / "model_metadata.json"
SPLITS_PATH = PROCESSED_DATASET_DIR / "splits.json"

SEQUENCE_LENGTH = 30
FEATURES_PER_FRAME = 126
EPOCHS = 60
BATCH_SIZE = 16
LEARNING_RATE = 0.001


def build_bilstm_model(num_classes: int, sequence_length: int = SEQUENCE_LENGTH, num_features: int = FEATURES_PER_FRAME):
    """
    Constructs and compiles the Keras Bidirectional LSTM classifier.
    """
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers

    model = models.Sequential(
        [
            layers.Input(shape=(sequence_length, num_features), name="landmark_sequence"),
            layers.Masking(mask_value=0.0, name="zero_frame_masking"),
            layers.Bidirectional(
                layers.LSTM(128, return_sequences=True),
                name="bilstm_1",
            ),
            layers.Dropout(0.3, name="dropout_1"),
            layers.Bidirectional(
                layers.LSTM(64, return_sequences=False),
                name="bilstm_2",
            ),
            layers.Dropout(0.3, name="dropout_2"),
            layers.Dense(64, activation="relu", name="dense_relu"),
            layers.Dropout(0.2, name="dropout_3"),
            layers.Dense(num_classes, activation="softmax", name="class_probabilities"),
        ],
        name="isl_lstm_v1",
    )

    model.compile(
        optimizer=optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def load_processed_dataset() -> tuple[np.ndarray, np.ndarray, list[str], list[dict[str, Any]]]:
    manifest_file = PROCESSED_DATASET_DIR / "metadata.json"
    if not manifest_file.exists():
        print(
            f"[ERROR] Processed dataset manifest not found at {manifest_file}.\n"
            "1. Record real videos with: python collect_data.py\n"
            "2. Extract landmarks with:  python extract_landmarks.py",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    samples = manifest.get("samples", [])
    classes = manifest.get("classes", [])
    if not samples:
        print(
            "[ERROR] Processed dataset contains 0 samples. Collect real videos and run extract_landmarks.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    X_list: list[np.ndarray] = []
    y_list: list[int] = []
    valid_samples: list[dict[str, Any]] = []

    for item in samples:
        npy_path = PROCESSED_DATASET_DIR / item["file"]
        if not npy_path.exists():
            continue
        seq = np.load(npy_path)
        if seq.shape != (SEQUENCE_LENGTH, FEATURES_PER_FRAME):
            print(f"[WARNING] Skipping {npy_path.name} with unexpected shape {seq.shape}")
            continue
        X_list.append(seq.astype(np.float32))
        y_list.append(int(item["label_index"]))
        valid_samples.append(item)

    if not X_list:
        print("[ERROR] No valid .npy sequence files could be loaded.", file=sys.stderr)
        sys.exit(1)

    X = np.stack(X_list, axis=0)
    y = np.asarray(y_list, dtype=np.int32)
    return X, y, classes, valid_samples


def split_dataset(
    X: np.ndarray,
    y: np.ndarray,
    samples: list[dict[str, Any]],
) -> dict[str, Any]:
    from sklearn.model_selection import train_test_split

    signers = [s.get("signer") for s in samples]
    unique_signers = sorted({s for s in signers if s})

    indices = np.arange(len(y))
    signer_independent = False

    if len(unique_signers) >= 3 and all(s is not None for s in signers):
        # Signer-independent split: hold out last signer for test, second-to-last for val
        signer_independent = True
        test_signers = {unique_signers[-1]}
        val_signers = {unique_signers[-2]}
        train_signers = set(unique_signers[:-2])

        train_idx = np.array([i for i, s in enumerate(signers) if s in train_signers], dtype=int)
        val_idx = np.array([i for i, s in enumerate(signers) if s in val_signers], dtype=int)
        test_idx = np.array([i for i, s in enumerate(signers) if s in test_signers], dtype=int)

        print("[SPLIT MODE] Signer-independent split active:")
        print(f"  Train signers: {sorted(train_signers)}")
        print(f"  Val signers:   {sorted(val_signers)}")
        print(f"  Test signers:  {sorted(test_signers)}")
    else:
        print(
            "[SPLIT MODE] Stratified video-level split active.\n"
            "  WARNING: Signer-independent metadata (< 3 distinct signers) is not present.\n"
            "  Reported accuracy reflects video-level holdout, NOT cross-signer generalization."
        )
        class_counts = Counter(y.tolist())
        min_class_count = min(class_counts.values())
        stratify_arg = y if min_class_count >= 3 else None

        train_val_idx, test_idx = train_test_split(
            indices,
            test_size=0.2,
            random_state=42,
            stratify=stratify_arg,
        )

        y_train_val = y[train_val_idx]
        tv_counts = Counter(y_train_val.tolist())
        stratify_tv = y_train_val if min(tv_counts.values()) >= 2 else None

        train_idx, val_idx = train_test_split(
            train_val_idx,
            test_size=0.2,
            random_state=42,
            stratify=stratify_tv,
        )

    return {
        "signer_independent": signer_independent,
        "train_idx": train_idx,
        "val_idx": val_idx,
        "test_idx": test_idx,
    }


def train() -> None:
    try:
        import tensorflow as tf
        from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
    except ImportError as exc:
        print(
            f"[ERROR] Missing dependency ({exc}).\n"
            "Install requirements first: pip install -r backend/isl/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    X, y, classes, samples = load_processed_dataset()
    num_classes = len(classes)

    class_counts = Counter(int(lbl) for lbl in y)
    dist_report = {classes[idx]: class_counts.get(idx, 0) for idx in range(num_classes)}

    split_info = split_dataset(X, y, samples)
    train_idx = split_info["train_idx"]
    val_idx = split_info["val_idx"]
    test_idx = split_info["test_idx"]

    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    print("=" * 68)
    print("SIGNMITRA ISL BiLSTM TRAINING SUMMARY")
    print("=" * 68)
    print(f"Total video sequences : {len(X)}")
    print(f"Number of classes     : {num_classes} ({', '.join(classes)})")
    print(f"Class distribution    : {json.dumps(dist_report)}")
    print(f"Train size            : {len(X_train)} videos")
    print(f"Validation size       : {len(X_val)} videos")
    print(f"Test size             : {len(X_test)} videos")
    print(f"Signer-independent    : {split_info['signer_independent']}")
    print("=" * 68)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Save split indices so evaluate.py evaluates strictly on held-out test set
    with open(SPLITS_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "signer_independent": split_info["signer_independent"],
                "train_indices": train_idx.tolist(),
                "val_indices": val_idx.tolist(),
                "test_indices": test_idx.tolist(),
            },
            f,
            indent=2,
        )

    model = build_bilstm_model(num_classes=num_classes)
    model.summary()

    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=12,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-5,
            verbose=1,
        ),
        ModelCheckpoint(
            filepath=str(MODEL_PATH),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    # Ensure final best model is saved
    model.save(str(MODEL_PATH))

    labels_payload = {
        "model": "isl-lstm-v1",
        "classes": classes,
        "index_to_label": {str(i): cls_name for i, cls_name in enumerate(classes)},
        "label_to_index": {cls_name: i for i, cls_name in enumerate(classes)},
    }
    with open(LABELS_PATH, "w", encoding="utf-8") as f:
        json.dump(labels_payload, f, indent=2)

    print("\n" + "=" * 68)
    print(f"[SAVED] Model saved to : {MODEL_PATH.relative_to(BASE_DIR)}")
    print(f"[SAVED] Labels saved to: {LABELS_PATH.relative_to(BASE_DIR)}")
    print("Run `python evaluate.py` next to compute held-out test metrics.")
    print("=" * 68)


if __name__ == "__main__":
    train()

