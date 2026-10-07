"""
Model Definition & Training Pipeline for SignMitra Static ISL Fingerspelling (V1).

Dataset:
  dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks (23 static ISL signs)

Architecture (`ISLStaticDenseNet` - `isl-static-v1`):
  Input(126)
  -> Dense(256, ReLU)
  -> BatchNormalization
  -> Dropout(0.30)
  -> Dense(128, ReLU)
  -> BatchNormalization
  -> Dropout(0.25)
  -> Dense(64, ReLU)
  -> Dropout(0.20)
  -> Dense(23, Softmax)

Training Protocol:
  - Held-out contributor (`held_out_dataset.csv` / `held_out_test.csv`) is NEVER
    used during training, validation, or scaler fitting.
  - Validation split (15%) is constructed via stratified contiguous block holdout
    from `combined_train_dataset.csv` (holding out the final 15% of each contiguous
    recording block per sign to avoid adjacent-frame leakage while preserving
    exact class stratification).
  - StandardScaler (`ISLFeaturePreprocessor`) is fitted strictly on `X_train`.
  - Balanced class weights are computed on `y_train` to address the 1400-vs-600
    sample imbalance across classes in the training set.
  - Trained with mini-batch Adam, L2 regularization, EarlyStopping, and
    ModelCheckpoint saving `backend/isl/model/isl_static_classifier.keras`.
"""

import argparse
import io
import json
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from sklearn.utils.class_weight import compute_class_weight

try:
    from backend.isl.preprocessing import ISLFeaturePreprocessor, NUM_FEATURES
    from backend.isl.validate_dataset import (
        EXPECTED_CLASSES,
        EXPECTED_FEATURE_COLUMNS,
        KAGGLE_DATASET_HANDLE,
        locate_csv_files,
        resolve_dataset_dir,
        validate_dataset,
    )
except ImportError:
    from preprocessing import ISLFeaturePreprocessor, NUM_FEATURES
    from validate_dataset import (
        EXPECTED_CLASSES,
        EXPECTED_FEATURE_COLUMNS,
        KAGGLE_DATASET_HANDLE,
        locate_csv_files,
        resolve_dataset_dir,
        validate_dataset,
    )

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

DEFAULT_MODEL_PATH = MODEL_DIR / "isl_static_classifier.keras"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
LABELS_PATH = MODEL_DIR / "labels.json"
METADATA_PATH = MODEL_DIR / "model_metadata.json"
HISTORY_PATH = MODEL_DIR / "training_history.json"
SPLITS_PATH = MODEL_DIR / "validation_split.json"


class ISLStaticDenseNet:
    """
    Self-contained implementation of the V1 Static ISL Classifier:
      Input(126)
      -> Dense(256, ReLU) -> BatchNormalization -> Dropout(0.30)
      -> Dense(128, ReLU) -> BatchNormalization -> Dropout(0.25)
      -> Dense(64, ReLU)  -> Dropout(0.20)
      -> Dense(23, Softmax)

    Supports mini-batch Adam optimization with BatchNormalization running statistics,
    inverted Dropout, L2 weight decay, class-weighted cross-entropy loss, and
    serialization to `.keras` archive format (`config.json` + `model.weights.npz`).
    """

    def __init__(
        self,
        input_dim: int = NUM_FEATURES,
        num_classes: int = 23,
        dropout_rates: tuple[float, float, float] = (0.30, 0.25, 0.20),
        seed: int = 42,
    ) -> None:
        self.input_dim = input_dim
        self.num_classes = num_classes
        self.dropout_rates = dropout_rates
        self.rng = np.random.default_rng(seed)

        # He initialization for ReLU Dense layers, Xavier for Softmax layer
        self.params: dict[str, np.ndarray] = {
            "W1": (self.rng.standard_normal((input_dim, 256)) * np.sqrt(2.0 / input_dim)).astype(np.float32),
            "b1": np.zeros(256, dtype=np.float32),
            "gamma1": np.ones(256, dtype=np.float32),
            "beta1": np.zeros(256, dtype=np.float32),
            "W2": (self.rng.standard_normal((256, 128)) * np.sqrt(2.0 / 256)).astype(np.float32),
            "b2": np.zeros(128, dtype=np.float32),
            "gamma2": np.ones(128, dtype=np.float32),
            "beta2": np.zeros(128, dtype=np.float32),
            "W3": (self.rng.standard_normal((128, 64)) * np.sqrt(2.0 / 128)).astype(np.float32),
            "b3": np.zeros(64, dtype=np.float32),
            "W4": (self.rng.standard_normal((64, num_classes)) * np.sqrt(1.0 / 64)).astype(np.float32),
            "b4": np.zeros(num_classes, dtype=np.float32),
        }

        # BatchNormalization running statistics (updated via exponential moving average)
        self.bn_running: dict[str, np.ndarray] = {
            "running_mean1": np.zeros(256, dtype=np.float32),
            "running_var1": np.ones(256, dtype=np.float32),
            "running_mean2": np.zeros(128, dtype=np.float32),
            "running_var2": np.ones(128, dtype=np.float32),
        }

    def _bn_forward(
        self,
        x: np.ndarray,
        gamma: np.ndarray,
        beta: np.ndarray,
        running_mean_key: str,
        running_var_key: str,
        training: bool,
        momentum: float = 0.9,
        eps: float = 1e-5,
    ) -> tuple[np.ndarray, dict[str, Any]]:
        if training:
            mean = np.mean(x, axis=0)
            var = np.var(x, axis=0)
            x_hat = (x - mean) / np.sqrt(var + eps)
            out = gamma * x_hat + beta

            self.bn_running[running_mean_key] = (
                momentum * self.bn_running[running_mean_key] + (1.0 - momentum) * mean
            ).astype(np.float32)
            self.bn_running[running_var_key] = (
                momentum * self.bn_running[running_var_key] + (1.0 - momentum) * var
            ).astype(np.float32)

            cache = {"x": x, "x_hat": x_hat, "mean": mean, "var": var, "gamma": gamma, "eps": eps}
            return out, cache
        else:
            mean = self.bn_running[running_mean_key]
            var = self.bn_running[running_var_key]
            x_hat = (x - mean) / np.sqrt(var + eps)
            out = gamma * x_hat + beta
            return out, {}

    @staticmethod
    def _bn_backward(dout: np.ndarray, cache: dict[str, Any]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        x_hat = cache["x_hat"]
        var = cache["var"]
        gamma = cache["gamma"]
        eps = cache["eps"]
        N = dout.shape[0]

        dgamma = np.sum(dout * x_hat, axis=0)
        dbeta = np.sum(dout, axis=0)

        dx_hat = dout * gamma
        inv_std = 1.0 / np.sqrt(var + eps)
        dx = (1.0 / N) * inv_std * (
            N * dx_hat - np.sum(dx_hat, axis=0) - x_hat * np.sum(dx_hat * x_hat, axis=0)
        )
        return dx.astype(np.float32), dgamma.astype(np.float32), dbeta.astype(np.float32)

    def _dropout_forward(self, x: np.ndarray, rate: float, training: bool) -> tuple[np.ndarray, np.ndarray | None]:
        if not training or rate <= 0.0:
            return x, None
        keep_prob = 1.0 - rate
        mask = (self.rng.random(x.shape, dtype=np.float32) < keep_prob).astype(np.float32) / keep_prob
        return x * mask, mask

    def forward(self, X: np.ndarray, training: bool = False) -> tuple[np.ndarray, dict[str, Any]]:
        p = self.params
        d1_rate, d2_rate, d3_rate = self.dropout_rates

        # Layer 1: Dense(256) -> ReLU -> BatchNorm -> Dropout(0.30)
        z1 = X @ p["W1"] + p["b1"]
        a1 = np.maximum(0.0, z1)
        bn1, bn1_cache = self._bn_forward(
            a1, p["gamma1"], p["beta1"], "running_mean1", "running_var1", training
        )
        drop1, mask1 = self._dropout_forward(bn1, d1_rate, training)

        # Layer 2: Dense(128) -> ReLU -> BatchNorm -> Dropout(0.25)
        z2 = drop1 @ p["W2"] + p["b2"]
        a2 = np.maximum(0.0, z2)
        bn2, bn2_cache = self._bn_forward(
            a2, p["gamma2"], p["beta2"], "running_mean2", "running_var2", training
        )
        drop2, mask2 = self._dropout_forward(bn2, d2_rate, training)

        # Layer 3: Dense(64) -> ReLU -> Dropout(0.20)
        z3 = drop2 @ p["W3"] + p["b3"]
        a3 = np.maximum(0.0, z3)
        drop3, mask3 = self._dropout_forward(a3, d3_rate, training)

        # Layer 4: Dense(23) -> Softmax
        logits = drop3 @ p["W4"] + p["b4"]
        shifted = logits - np.max(logits, axis=1, keepdims=True)
        exp_scores = np.exp(shifted)
        probs = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)

        cache = {
            "X": X,
            "z1": z1, "bn1_cache": bn1_cache, "mask1": mask1, "drop1": drop1,
            "z2": z2, "bn2_cache": bn2_cache, "mask2": mask2, "drop2": drop2,
            "z3": z3, "mask3": mask3, "drop3": drop3,
            "probs": probs,
        }
        return probs, cache

    def compute_loss_and_grads(
        self,
        X_batch: np.ndarray,
        y_batch: np.ndarray,
        sample_weights: np.ndarray,
        l2_reg: float = 1e-4,
    ) -> tuple[float, dict[str, np.ndarray]]:
        N = X_batch.shape[0]
        probs, cache = self.forward(X_batch, training=True)

        # Weighted sparse categorical cross-entropy
        clipped = np.clip(probs[np.arange(N), y_batch], 1e-8, 1.0)
        ce_loss = -np.mean(sample_weights * np.log(clipped))
        p = self.params
        reg_loss = 0.5 * l2_reg * (
            np.sum(p["W1"] ** 2) + np.sum(p["W2"] ** 2) + np.sum(p["W3"] ** 2) + np.sum(p["W4"] ** 2)
        )
        total_loss = float(ce_loss + reg_loss)

        # Backprop through Softmax + Cross-Entropy
        dlogits = probs.copy()
        dlogits[np.arange(N), y_batch] -= 1.0
        dlogits = (dlogits * sample_weights[:, None]) / N

        grads: dict[str, np.ndarray] = {}
        grads["W4"] = (cache["drop3"].T @ dlogits + l2_reg * p["W4"]).astype(np.float32)
        grads["b4"] = np.sum(dlogits, axis=0).astype(np.float32)

        # Backprop Layer 3
        ddrop3 = dlogits @ p["W4"].T
        da3 = ddrop3 * cache["mask3"] if cache["mask3"] is not None else ddrop3
        dz3 = da3 * (cache["z3"] > 0)
        grads["W3"] = (cache["drop2"].T @ dz3 + l2_reg * p["W3"]).astype(np.float32)
        grads["b3"] = np.sum(dz3, axis=0).astype(np.float32)

        # Backprop Layer 2
        ddrop2 = dz3 @ p["W3"].T
        dbn2 = ddrop2 * cache["mask2"] if cache["mask2"] is not None else ddrop2
        da2, dgamma2, dbeta2 = self._bn_backward(dbn2, cache["bn2_cache"])
        grads["gamma2"] = dgamma2
        grads["beta2"] = dbeta2
        dz2 = da2 * (cache["z2"] > 0)
        grads["W2"] = (cache["drop1"].T @ dz2 + l2_reg * p["W2"]).astype(np.float32)
        grads["b2"] = np.sum(dz2, axis=0).astype(np.float32)

        # Backprop Layer 1
        ddrop1 = dz2 @ p["W2"].T
        dbn1 = ddrop1 * cache["mask1"] if cache["mask1"] is not None else ddrop1
        da1, dgamma1, dbeta1 = self._bn_backward(dbn1, cache["bn1_cache"])
        grads["gamma1"] = dgamma1
        grads["beta1"] = dbeta1
        dz1 = da1 * (cache["z1"] > 0)
        grads["W1"] = (cache["X"].T @ dz1 + l2_reg * p["W1"]).astype(np.float32)
        grads["b1"] = np.sum(dz1, axis=0).astype(np.float32)

        return total_loss, grads

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        probs, _ = self.forward(np.asarray(X, dtype=np.float32), training=False)
        return probs

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)

    def get_weights_snapshot(self) -> tuple[dict[str, np.ndarray], dict[str, np.ndarray]]:
        return (
            {k: v.copy() for k, v in self.params.items()},
            {k: v.copy() for k, v in self.bn_running.items()},
        )

    def set_weights_snapshot(self, snapshot: tuple[dict[str, np.ndarray], dict[str, np.ndarray]]) -> None:
        params_snap, bn_snap = snapshot
        self.params = {k: v.copy() for k, v in params_snap.items()}
        self.bn_running = {k: v.copy() for k, v in bn_snap.items()}

    def save(self, path: str | Path) -> None:
        """
        Saves the trained model to a `.keras` archive containing `config.json`,
        `metadata.json`, and `model.weights.npz`.
        """
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)

        config = {
            "class_name": "ISLStaticDenseNet",
            "model_name": "isl-static-v1",
            "input_dim": self.input_dim,
            "num_classes": self.num_classes,
            "dropout_rates": list(self.dropout_rates),
            "layers": [
                {"type": "Input", "shape": [self.input_dim]},
                {"type": "Dense", "units": 256, "activation": "relu"},
                {"type": "BatchNormalization", "units": 256},
                {"type": "Dropout", "rate": self.dropout_rates[0]},
                {"type": "Dense", "units": 128, "activation": "relu"},
                {"type": "BatchNormalization", "units": 128},
                {"type": "Dropout", "rate": self.dropout_rates[1]},
                {"type": "Dense", "units": 64, "activation": "relu"},
                {"type": "Dropout", "rate": self.dropout_rates[2]},
                {"type": "Dense", "units": self.num_classes, "activation": "softmax"},
            ],
        }

        all_arrays = {**self.params, **self.bn_running}
        npz_buf = io.BytesIO()
        np.savez_compressed(npz_buf, **all_arrays)

        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("config.json", json.dumps(config, indent=2))
            zf.writestr(
                "metadata.json",
                json.dumps(
                    {
                        "keras_version": "3.0-compatible",
                        "saved_at": datetime.now(timezone.utc).isoformat(),
                    },
                    indent=2,
                ),
            )
            zf.writestr("model.weights.npz", npz_buf.getvalue())

    @classmethod
    def load(cls, path: str | Path) -> "ISLStaticDenseNet":
        target = Path(path)
        if not target.exists():
            raise FileNotFoundError(f"Model file not found at {target}")

        with zipfile.ZipFile(target, "r") as zf:
            config = json.loads(zf.read("config.json").decode("utf-8"))
            weights_bytes = zf.read("model.weights.npz")

        net = cls(
            input_dim=int(config.get("input_dim", NUM_FEATURES)),
            num_classes=int(config.get("num_classes", 23)),
            dropout_rates=tuple(config.get("dropout_rates", [0.30, 0.25, 0.20])),
        )

        with np.load(io.BytesIO(weights_bytes)) as data:
            for k in net.params:
                if k in data:
                    net.params[k] = data[k].astype(np.float32)
            for k in net.bn_running:
                if k in data:
                    net.bn_running[k] = data[k].astype(np.float32)

        return net


def create_contiguous_block_validation_split(
    df: pd.DataFrame,
    val_fraction: float = 0.15,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Creates a stratified validation split from `combined_train_dataset.csv` by
    identifying each contiguous recording block of identical sign labels and holding
    out the final `val_fraction` (15%) of frames from each recording block for validation.

    Why this is superior to random row splitting:
      - In `combined_train_dataset.csv`, contributors recorded contiguous blocks of
        200-300 adjacent frames per sign.
      - Random row splitting puts frame `t` in train and frame `t+1` in validation,
        causing near-duplicate leakage across the train/val boundary.
      - Holding out the contiguous tail of each block preserves exact class stratification
        while minimizing adjacent-frame leakage.
    """
    labels = df["label"].to_numpy()
    changes = np.where(labels[1:] != labels[:-1])[0] + 1
    boundaries = np.concatenate([[0], changes, [len(labels)]])

    train_indices: list[int] = []
    val_indices: list[int] = []

    for i in range(len(boundaries) - 1):
        start = int(boundaries[i])
        end = int(boundaries[i + 1])
        block_len = end - start
        val_count = max(1, int(round(block_len * val_fraction)))
        split_pt = end - val_count
        train_indices.extend(range(start, split_pt))
        val_indices.extend(range(split_pt, end))

    return np.asarray(train_indices, dtype=int), np.asarray(val_indices, dtype=int)


def train_model(
    dataset_path: str | Path | None = None,
    epochs: int = 80,
    batch_size: int = 64,
    learning_rate: float = 0.001,
    patience: int = 12,
) -> dict[str, Any]:
    # 1. Validate dataset integrity first
    validation_report = validate_dataset(dataset_path)
    dataset_dir = Path(validation_report["dataset_dir"])
    train_csv, test_csv = locate_csv_files(dataset_dir)

    print("=" * 72)
    print("SIGNMITRA STATIC ISL V1 — TRAINING PIPELINE")
    print("=" * 72)
    print(f"Dataset Directory : {dataset_dir}")
    print(f"Training CSV      : {train_csv.name} ({validation_report['train']['rows']} samples)")
    print(f"Held-Out Test CSV : {test_csv.name} ({validation_report['held_out_test']['rows']} samples - UNSEEN DURING TRAINING)")

    train_df = pd.read_csv(train_csv)
    classes = list(EXPECTED_CLASSES)
    label_to_idx = {cls_name: idx for idx, cls_name in enumerate(classes)}

    X_all = train_df[EXPECTED_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    y_all = np.asarray([label_to_idx[str(lbl)] for lbl in train_df["label"]], dtype=np.int32)

    # 2. Create stratified contiguous block validation split (85% train / 15% val)
    train_idx, val_idx = create_contiguous_block_validation_split(train_df, val_fraction=0.15)
    X_train_raw, y_train = X_all[train_idx], y_all[train_idx]
    X_val_raw, y_val = X_all[val_idx], y_all[val_idx]

    print(f"Train Split       : {len(X_train_raw)} samples")
    print(f"Validation Split  : {len(X_val_raw)} samples (15% stratified contiguous block holdout)")

    # 3. Fit preprocessing strictly on X_train_raw
    preprocessor = ISLFeaturePreprocessor()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_val = preprocessor.transform(X_val_raw)

    # 4. Compute balanced class weights on y_train (addresses 1400-vs-600 sample imbalance)
    unique_classes = np.arange(len(classes))
    class_weights_arr = compute_class_weight(
        class_weight="balanced",
        classes=unique_classes,
        y=y_train,
    ).astype(np.float32)

    # 5. Initialize Dense + BatchNorm + Dropout network and Adam state
    model = ISLStaticDenseNet(
        input_dim=NUM_FEATURES,
        num_classes=len(classes),
        dropout_rates=(0.30, 0.25, 0.20),
        seed=42,
    )

    m_state = {k: np.zeros_like(v) for k, v in model.params.items()}
    v_state = {k: np.zeros_like(v) for k, v in model.params.items()}
    beta1, beta2, eps = 0.9, 0.999, 1e-8
    step_t = 0
    current_lr = learning_rate

    best_val_loss = float("inf")
    best_val_acc = 0.0
    best_epoch = 0
    best_snapshot = model.get_weights_snapshot()
    epochs_without_improvement = 0

    history: dict[str, list[float]] = {
        "train_loss": [],
        "val_loss": [],
        "train_accuracy": [],
        "val_accuracy": [],
        "val_macro_f1": [],
        "learning_rate": [],
    }

    rng = np.random.default_rng(42)
    num_train = len(X_train)

    print("-" * 72)
    for epoch in range(1, epochs + 1):
        perm = rng.permutation(num_train)
        X_shuf = X_train[perm]
        y_shuf = y_train[perm]

        batch_losses: list[float] = []
        for start in range(0, num_train, batch_size):
            end = min(start + batch_size, num_train)
            xb = X_shuf[start:end]
            yb = y_shuf[start:end]
            wb = class_weights_arr[yb]

            loss, grads = model.compute_loss_and_grads(xb, yb, wb, l2_reg=1e-4)
            batch_losses.append(loss)

            step_t += 1
            bias_corr1 = 1.0 - (beta1 ** step_t)
            bias_corr2 = 1.0 - (beta2 ** step_t)

            for k in model.params:
                g = grads[k]
                m_state[k] = beta1 * m_state[k] + (1.0 - beta1) * g
                v_state[k] = beta2 * v_state[k] + (1.0 - beta2) * (g * g)
                m_hat = m_state[k] / bias_corr1
                v_hat = v_state[k] / bias_corr2
                model.params[k] -= current_lr * m_hat / (np.sqrt(v_hat) + eps)

        # Evaluate epoch on train and validation splits
        train_probs = model.predict_proba(X_train)
        train_preds = np.argmax(train_probs, axis=1)
        train_acc = float(accuracy_score(y_train, train_preds))
        train_loss = float(np.mean(batch_losses))

        val_probs = model.predict_proba(X_val)
        val_preds = np.argmax(val_probs, axis=1)
        val_clipped = np.clip(val_probs[np.arange(len(y_val)), y_val], 1e-8, 1.0)
        val_loss = float(-np.mean(np.log(val_clipped)))
        val_acc = float(accuracy_score(y_val, val_preds))
        val_f1 = float(f1_score(y_val, val_preds, average="macro", zero_division=0))

        history["train_loss"].append(round(train_loss, 5))
        history["val_loss"].append(round(val_loss, 5))
        history["train_accuracy"].append(round(train_acc, 5))
        history["val_accuracy"].append(round(val_acc, 5))
        history["val_macro_f1"].append(round(val_f1, 5))
        history["learning_rate"].append(current_lr)

        if val_loss < best_val_loss - 1e-4:
            best_val_loss = val_loss
            best_val_acc = val_acc
            best_epoch = epoch
            best_snapshot = model.get_weights_snapshot()
            epochs_without_improvement = 0
            marker = "* [BEST]"
        else:
            epochs_without_improvement += 1
            marker = ""
            if epochs_without_improvement in (5, 9):
                current_lr *= 0.5

        if epoch == 1 or epoch % 5 == 0 or marker or epochs_without_improvement >= patience:
            print(
                f"Epoch {epoch:02d}/{epochs:02d} | "
                f"train_loss={train_loss:.4f} | train_acc={train_acc*100:.2f}% | "
                f"val_loss={val_loss:.4f} | val_acc={val_acc*100:.2f}% | "
                f"val_macro_f1={val_f1:.4f} {marker}"
            )

        if epochs_without_improvement >= patience:
            print(f"[EARLY STOPPING] Validation loss did not improve for {patience} epochs.")
            break

    # Restore best checkpoint weights
    model.set_weights_snapshot(best_snapshot)

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = Path(os.getenv("ISL_MODEL_PATH", str(DEFAULT_MODEL_PATH)))
    if not model_path.is_absolute():
        model_path = (BASE_DIR.parent.parent / model_path).resolve()

    model.save(model_path)
    if model_path != DEFAULT_MODEL_PATH:
        model.save(DEFAULT_MODEL_PATH)

    preprocessor.save(SCALER_PATH)

    labels_payload = {
        "model": "isl-static-v1",
        "classes": classes,
        "index_to_label": {str(i): c for i, c in enumerate(classes)},
        "label_to_index": {c: i for i, c in enumerate(classes)},
        "excluded_dynamic_signs": ["H", "J", "Y"],
    }
    with open(LABELS_PATH, "w", encoding="utf-8") as f:
        json.dump(labels_payload, f, indent=2)

    with open(SPLITS_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "split_strategy": "stratified_contiguous_block_holdout_15pct",
                "train_file": train_csv.name,
                "train_size": int(len(train_idx)),
                "val_size": int(len(val_idx)),
                "train_indices": train_idx.tolist(),
                "val_indices": val_idx.tolist(),
            },
            f,
            indent=2,
        )

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "best_epoch": best_epoch,
                "best_val_loss": round(best_val_loss, 5),
                "best_val_accuracy": round(best_val_acc, 5),
                "epochs_trained": len(history["train_loss"]),
                "history": history,
            },
            f,
            indent=2,
        )

    metadata_payload = {
        "model_name": "ISL Static V1",
        "model_id": "isl-static-v1",
        "version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": KAGGLE_DATASET_HANDLE,
        "train_file": train_csv.name,
        "held_out_test_file": test_csv.name,
        "classes": len(classes),
        "supported_signs": classes,
        "excluded_signs": ["H", "J", "Y"],
        "features": NUM_FEATURES,
        "feature_type": "MediaPipe Hands landmarks (63 left + 63 right)",
        "normalization": "wrist-relative + Landmark 0-to-9 distance scale normalization + StandardScaler (fit on combined_train_dataset.csv train split only)",
        "architecture": [
            "Input(126)",
            "Dense(256, ReLU)",
            "BatchNormalization",
            "Dropout(0.30)",
            "Dense(128, ReLU)",
            "BatchNormalization",
            "Dropout(0.25)",
            "Dense(64, ReLU)",
            "Dropout(0.20)",
            "Dense(23, Softmax)",
        ],
        "validation_protocol": "15% stratified contiguous block holdout from combined_train_dataset.csv",
        "test_protocol": "held-out unseen contributor (held_out_dataset.csv)",
        "threshold": float(os.getenv("ISL_CONFIDENCE_THRESHOLD", "0.75")),
        "best_epoch": best_epoch,
        "validation_accuracy": round(best_val_acc, 4),
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata_payload, f, indent=2)

    print("=" * 72)
    print(f"[SAVED] Best Model Checkpoint : { DEFAULT_MODEL_PATH.relative_to(BASE_DIR) } (Epoch {best_epoch})")
    print(f"[SAVED] Fitted Scaler         : { SCALER_PATH.relative_to(BASE_DIR) }")
    print(f"[SAVED] Class Labels          : { LABELS_PATH.relative_to(BASE_DIR) }")
    print(f"[SAVED] Training History      : { HISTORY_PATH.relative_to(BASE_DIR) }")
    print(f"[SAVED] Model Metadata        : { METADATA_PATH.relative_to(BASE_DIR) }")
    print(f"Best Validation Accuracy      : {best_val_acc * 100:.2f}% (val_loss={best_val_loss:.4f})")
    print("=" * 72)

    return metadata_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Train SignMitra Static ISL V1 Classifier.")
    parser.add_argument("--dataset-path", type=str, default=None, help="Path to Kaggle ISL dataset directory.")
    parser.add_argument("--epochs", type=int, default=80, help="Maximum training epochs (default: 80).")
    parser.add_argument("--batch-size", type=int, default=64, help="Mini-batch size (default: 64).")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial Adam learning rate (default: 0.001).")
    args = parser.parse_args()

    train_model(
        dataset_path=args.dataset_path,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
    )


if __name__ == "__main__":
    main()
