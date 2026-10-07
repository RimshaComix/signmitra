# SignMitra Static ISL Fingerspelling Recognition Pipeline (V1)

## 1. Overview & Architecture

This module provides a **real, trained static Indian Sign Language (ISL) fingerspelling recognition pipeline** for SignMitra's **ISL Lab** (`Static ISL Fingerspelling Recognition`).

End-to-end flow:
```text
Browser Webcam (Selfie Mirror Orientation)
  ↓
MediaPipe HandLandmarker (21 3D landmarks × 2 hands = 126 wrist-relative features)
  ↓
Next.js Proxy Route (POST /api/isl/predict)
  ↓
FastAPI Inference Service (POST /predict)
  ↓
StandardScaler (scaler.pkl fitted strictly on training split)
  ↓
Trained Dense Neural Classifier (isl_static_classifier.keras: 126 -> 256 -> 128 -> 64 -> 23)
  ↓
Real Softmax Probabilities + Top-3 Candidates + Confidence Gate (>= 0.75)
  ↓
Temporal Majority Vote Smoother (3 of last 5 frames)
  ↓
User Confirmation Gate ([ Confirm ] / [ Try Again ])
  ↓
SignMitra Communication Workflow ([ISL Signed: <SIGN>])
```

- **Never fabricates predictions, confidence scores, or metrics.**
- **Requires explicit user confirmation** before any recognized sign is added to the user's communication workflow.
- **Returns HTTP 503 (`MODEL NOT TRAINED`)** if `model/isl_static_classifier.keras` or `model/scaler.pkl` is unavailable.

---

## 2. Dataset Attribution & License

- **Dataset**: [`dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks`](https://www.kaggle.com/datasets/dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks)
- **Author**: Dwibon Bhargab Deka
- **License**: **CC BY-SA 4.0** (Creative Commons Attribution-ShareAlike 4.0 International)
- **Dataset Files**:
  - `combined_train_dataset.csv` (or `combined_train_v2.csv`): **21,740** multi-contributor training samples (`126` feature columns + `label`)
  - `held_out_dataset.csv` (or `held_out_test.csv`): **1,150** samples (`50` per class across all `23` classes) from a **completely unseen contributor** held out exclusively for final generalization evaluation

> **Important**: The raw Kaggle CSV dataset files (`*.csv`, `*.zip`) are ignored via `.gitignore` and must never be committed to Git. Furthermore, the unseen contributor held-out test set is **never** merged into training or `StandardScaler` fitting.

---

## 3. Supported 23 Static ISL Signs & Excluded Dynamic Signs

### Supported 23 Static Signs
`A, B, C, D, E, F, G, I, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Z`

### Excluded Dynamic Signs
`H, J, Y` — Excluded because they require multi-frame dynamic motion trajectories in Indian Sign Language and cannot be represented honestly by a single-frame static landmark vector.

---

## 4. Shared Preprocessing (`preprocessing.py`)

Both training/evaluation (`train.py`, `evaluate.py`, `predict.py`) and live browser MediaPipe extraction (`ISLLab.js`) enforce the exact same 126-feature layout and wrist-relative coordinate representation:

1. **Feature Vector Shape (`126` floats)**:
   - `[0:63]` (`left_lm0_x .. left_lm20_z`): Slot 1 hand (`21` landmarks × `(x, y, z)`)
   - `[63:126]` (`right_lm0_x .. right_lm20_z`): Slot 2 hand (`21` landmarks × `(x, y, z)`)
2. **Wrist-Relative Coordinates**:
   - For each detected hand, landmark `0` (wrist) is subtracted from all `21` landmarks:
     $$(\Delta x_i, \Delta y_i, \Delta z_i) = (x_i - x_0,\; y_i - y_0,\; z_i - z_0)$$
   - Consequently, `left_lm0_x = left_lm0_y = left_lm0_z = 0.0` and `right_lm0_x = right_lm0_y = right_lm0_z = 0.0`.
3. **Hand Slot Ordering & Missing-Hand Convention**:
   - **Two hands detected**: Sorted by horizontal wrist `x` in mirrored selfie space — smaller `x` fills `[0:63]`, larger `x` fills `[63:126]`.
   - **One hand detected**: `[0:63]` is zero-filled (`63` zeros) and the detected hand populates `[63:126]`, matching the Kaggle dataset's single-hand convention (e.g., `C, I, L, O, U, V`).
   - **Zero hands detected**: Rejected before inference.
4. **Feature Scaling (`scaler.pkl`)**:
   - `StandardScaler` is fitted **exclusively** on the training split (`X_train`) and saved to `model/scaler.pkl`.

---

## 5. Model Architecture (`isl-static-dense-v1`)

Defined in `train.py`:

```text
Input(shape=(126,))
  ↓
Dense(256, activation="relu") -> BatchNormalization -> Dropout(0.30)
  ↓
Dense(128, activation="relu") -> BatchNormalization -> Dropout(0.25)
  ↓
Dense(64, activation="relu")  -> Dropout(0.20)
  ↓
Dense(23, activation="softmax")
```

- **Optimizer**: Mini-batch `Adam` (`learning_rate=0.001`, `batch_size=64`)
- **Loss**: Balanced sample-weighted cross-entropy (`compute_sample_weight("balanced")` to account for the `1,400` vs `600` sample per class distribution in `combined_train_dataset.csv`)
- **Validation Split**: 15% stratified contiguous block holdout (`18,479` train / `3,261` validation) to prevent adjacent-frame leakage within `combined_train_dataset.csv`
- **Early Stopping**: Restores best validation loss weights (best checkpoint at Epoch 9)

---

## 6. Measured Evaluation Results

 validation metrics and unseen-contributor test metrics are reported separately (`model/evaluation_metrics.json`, `model/classification_report.txt`):

| Split | Samples | Accuracy | Macro Precision | Macro Recall | Macro F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Validation Split** (15% contiguous block holdout) | 3,261 | **100.00%** (`1.0000`) | `1.0000` | `1.0000` | `1.0000` |
| **Held-Out Test Set** (Unseen Contributor `held_out_dataset.csv`) | 1,150 | **99.22%** (`0.9922`) | `0.9930` | `0.9922` | `0.9920` |

- **Per-Class Performance on Unseen Contributor (`1,150` samples, `50` per class)**:
  - **19 of 23 classes** achieve `1.0000` F1 score.
  - **`W`**: Precision `1.0000`, Recall `0.8200`, F1 `0.9011` (`41/50` correct; `7` predicted as `R`, `1` as `C`, `1` as `S` where one hand dropped out in the raw capture).
  - **`R`**: Precision `0.8772`, Recall `1.0000`, F1 `0.9346`.
  - **`C` & `S`**: Precision `0.9804`, Recall `1.0000`, F1 `0.9901`.

---

## 7. Environment Variables

Configure in `.env` or shell environment:

```env
ISL_PYTHON_API=http://127.0.0.1:8000
ISL_CONFIDENCE_THRESHOLD=0.75
ISL_MODEL_PATH=backend/isl/model/isl_static_classifier.keras
ISL_DATASET_PATH=backend/isl/dataset/kaggle_isl
```

---

## 8. Step-by-Step Instructions

### A. Validate Dataset
```bash
python backend/isl/validate_dataset.py
```
*(Automatically reads from `ISL_DATASET_PATH`, `backend/isl/dataset/kaggle_isl`, or downloads via `kagglehub.dataset_download("dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks")`.)*

### B. Train Model
```bash
python backend/isl/train.py
```
Outputs to `backend/isl/model/`:
- `isl_static_classifier.keras`
- `scaler.pkl`
- `labels.json`
- `model_metadata.json`
- `training_history.json`

### C. Evaluate on Unseen Contributor Test Set
```bash
python backend/isl/evaluate.py
```
Outputs to `backend/isl/model/`:
- `evaluation_metrics.json`
- `classification_report.txt`
- `confusion_matrix.png`

### D. Run FastAPI Inference Service
You can run either the main SignMitra FastAPI backend (recommended, includes all AI Studio and ISL endpoints):
```bash
uvicorn backend.main:app --reload --port 8000
```
or the standalone ISL FastAPI service:
```bash
uvicorn backend.isl.app:app --reload --port 8000
```

Endpoints exposed:
- `GET /health` and `GET /api/isl/health`
- `POST /predict` and `POST /api/isl/predict`

### E. Run Next.js Frontend
```bash
npm run dev
```
Open `http://localhost:3000/ai-studio` and select the **ISL Lab** tab.

---

## 9. Limitations & Safety Notice

1. **Static Fingerspelling Only (23 Signs)**: Recognizes the 23 static ISL alphabet signs (`A..Z` excluding `H, J, Y`). Does not recognize dynamic trajectory signs (`H, J, Y`) or continuous multi-sign ISL sentences/grammar.
2. **Hand Landmarks Only**: Uses 3D hand skeleton coordinates (`126` features) and does not capture facial expressions, head movements, or body posture.
3. **Assistive Tool, Not Certified Interpretation**: Predictions are machine-learning candidates gated by a confidence threshold (`0.75`), temporal majority smoothing (`3/5` frames), and mandatory user confirmation before insertion into any communication card.
