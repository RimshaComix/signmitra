# SignMitra Isolated-Sign ISL Recognition Pipeline (V1)

## 1. What the Model Does

This module provides a **real, trainable isolated-sign Indian Sign Language (ISL) recognition pipeline** for SignMitra's **ISL Lab** (`Limited-Vocabulary Recognition`).

End-to-end flow:
```text
Camera
  ↓
MediaPipe Hand Landmarks (21 landmarks × 3 coords × 2 hands = 126 features/frame)
  ↓
30-Frame Temporal Sequence (30 × 126)
  ↓
Bidirectional LSTM (BiLSTM) Classifier
  ↓
Real Softmax Prediction + Confidence
  ↓
Confidence Threshold Gate (>= 75%)
  ↓
User Confirmation Gate ([ Confirm ] / [ Try Again ])
  ↓
Communication Card / [ISL Signed: <SIGN>]
```

- **Never fabricates predictions or confidence values.**
- **Requires explicit user confirmation** before any recognized sign is added to the user's communication workflow.
- **Returns HTTP 503 (`MODEL NOT TRAINED`)** if `model/isl_lstm.keras` has not been trained yet.

---

## 2. Current Vocabulary (V1)

V1 classifies **6 isolated functional signs**:

1. `HELLO`
2. `THANK_YOU`
3. `HELP`
4. `DOCTOR`
5. `WHERE`
6. `WATER`

---

## 3. Dataset Collection

`collect_data.py` records **real webcam video clips** (default: 50 videos per sign, 3.0 seconds per clip at 30 FPS) with a 3-second preparation countdown before each clip.

### Standard Collection
Saves clips to `dataset/raw/<SIGN>/`:
```bash
python collect_data.py
```

### Signer-Aware Collection (Recommended for Generalization)
To avoid signer leakage between training and testing, pass `--signer` so videos are stored under `dataset/raw/<signer_id>/<SIGN>/`:
```bash
python collect_data.py --signer signer_A
python collect_data.py --signer signer_B
python collect_data.py --signer signer_C
python collect_data.py --signer signer_D
python collect_data.py --signer signer_E
```

Press **`Q`** at any time in the camera window to quit safely.

---

## 4. Landmark Representation (`30 × 126`)

Both `extract_landmarks.py` (Python training/CLI) and `ISLLab.js` (browser MediaPipe HandLandmarker) apply the **exact same mathematical preprocessing**:

1. **Selfie Mirror Alignment**: Horizontal mirror orientation so webcam capture matches browser viewfinder.
2. **Up to 2 Hands per Frame**:
   - Detected hands are sorted left-to-right by wrist `x`-coordinate.
   - Each hand has `21` landmarks with `(x, y, z)` coordinates (`21 × 3 = 63` values).
3. **Wrist-Relative Translation**:
   - Landmark `0` (wrist) is subtracted from all 21 landmarks of that hand:
     $(\Delta x_i, \Delta y_i, \Delta z_i) = (x_i - x_0, y_i - y_0, z_i - z_0)$.
4. **Scale Normalization**:
   - Divided by the maximum Euclidean distance from the wrist across the 21 landmarks:
     $d_{\max} = \max_{i} \sqrt{\Delta x_i^2 + \Delta y_i^2 + \Delta z_i^2}$.
5. **Missing Hand Handling**:
   - **1 hand detected**: First `63` features populated, second `63` features zero-filled.
   - **0 hands detected**: All `126` features zero-filled.
   - Videos with zero hand detections across all frames are rejected during extraction.
6. **Temporal Sequence (`SEQUENCE_LENGTH = 30`)**:
   - Shorter clips are zero-padded at the end to `30` frames.
   - Longer clips are uniformly resampled across time to `30` frames.
   - Final sample tensor shape: `(30, 126)`.

---

## 5. Model Architecture

Defined in `train.py` (`isl-lstm-v1`):

```text
Input(shape=(30, 126))
  ↓
Masking(mask_value=0.0)
  ↓
Bidirectional(LSTM(128, return_sequences=True))
  ↓
Dropout(0.3)
  ↓
Bidirectional(LSTM(64))
  ↓
Dropout(0.3)
  ↓
Dense(64, activation="relu")
  ↓
Dropout(0.2)
  ↓
Dense(6, activation="softmax")
```

- **Optimizer**: `Adam(learning_rate=0.001)`
- **Loss**: `sparse_categorical_crossentropy`
- **Metric**: `accuracy`

---

## 6. Training Process

- Splits data strictly at the **video level** (frames from the same video are never split between train and test).
- If $\ge 3$ signers are present, performs a **signer-independent split** (holding out distinct signers for validation and testing).
- If fewer than 3 signers are present, uses a **stratified video-level split** and prints an explicit warning that evaluation is not signer-independent.
- Trains for up to `60` epochs with `batch_size=16`, `EarlyStopping`, `ReduceLROnPlateau`, and `ModelCheckpoint`.
- Outputs:
  - `model/isl_lstm.keras`
  - `model/labels.json`
  - `dataset/processed/splits.json`

---

## 7. Evaluation

`evaluate.py` loads `model/isl_lstm.keras` and evaluates strictly on the held-out test set from `dataset/processed/splits.json`, reporting:
- Test Accuracy
- Macro Precision, Macro Recall, and Macro F1
- Per-class classification report
- Confusion Matrix (console + `model/confusion_matrix.png`)
- Updates `model/model_metadata.json` with measured test metrics

---

## 8. How to Run (Step-by-Step Commands)

From `backend/isl`:

```bash
python -m venv .venv
```

Windows activation:
```bash
.venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

1. Collect real webcam training videos:
```bash
python collect_data.py
```

2. Extract MediaPipe `(30, 126)` landmark sequences:
```bash
python extract_landmarks.py
```

3. Train the BiLSTM classifier:
```bash
python train.py
```

4. Evaluate on held-out test split:
```bash
python evaluate.py
```

5. Run local real-time webcam prediction:
```bash
python predict.py
```

6. Start the FastAPI inference service:
```bash
uvicorn app:app --reload --port 8000
```
*(Note: The ISL `/health` and `/predict` endpoints are also mounted on the main SignMitra FastAPI backend when started via `uvicorn backend.main:app --reload --port 8000` from the repository root.)*

---

## 9. Connecting to Next.js

Configure the environment variable in `.env` (defaults to `http://127.0.0.1:8000`):

```env
ISL_PYTHON_API=http://127.0.0.1:8000
```

Next.js route `app/api/isl/predict/route.js` proxies:
- `GET /api/isl/predict` → `GET ${ISL_PYTHON_API}/health`
- `POST /api/isl/predict` → `POST ${ISL_PYTHON_API}/predict`

---

## 10. Current Limitations & Safety Notice

- **Isolated Signs Only**: Recognizes the 6 discrete V1 signs (`HELLO`, `THANK_YOU`, `HELP`, `DOCTOR`, `WHERE`, `WATER`). It does **not** perform continuous sentence-level ISL translation.
- **Assistive Tool, Not Certified Interpretation**: Predictions are model-generated candidates and always require user confirmation before use.
- **Signer Generalization**: Accurate cross-signer recognition requires collecting training samples across multiple diverse signers, lighting conditions, and backgrounds.
- **Hand Landmarks Only**: V1 extracts 3D hand skeleton landmarks (`126` features/frame) and does not capture non-manual markers (facial expressions, eyebrow movement, head tilt, or torso posture).

