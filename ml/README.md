# ISL (Indian Sign Language) Classification Model

## What This Model Does

This model classifies **Indian Sign Language (ISL) alphabets A-Z** from webcam-captured images.

Given a 100x100 grayscale image (10,000 pixel values), the model predicts which ISL letter the user is displaying and outputs a confidence score.

The model is served by the FastAPI inference service (`main.py`) on port 8001 and is called by the frontend's Assessment and WebcamTracker components.

---

## Architecture

```
Webcam -> 100x100 grayscale frame -> PCA (10000 -> 150) -> Random Forest -> Predicted Letter + Confidence
```

| Component | Detail |
|---|---|
| **Algorithm** | Random Forest (300 trees) with PCA dimensionality reduction |
| **Input** | 10,000 floats (100x100 grayscale pixels, normalized to 0-1) |
| **PCA Components** | 150 (explains ~89% of variance) |
| **Output** | Letter label (A-Z) + confidence (0.0-1.0) |
| **Saved Format** | `.pkl` via joblib (primary) + pickle (backup) |
| **Test Accuracy** | **96.51%** |
| **Total Samples** | 12,636 (10,114 train + 2,522 test) |

---

## Dataset

### Source: ISL Hand Image Dataset

The training data consists of **real photographs** of Indian Sign Language alphabet hand signs, organized as:

- **Training set**: `data/train_ISL.csv` (10,114 samples)
- **Test set**: `data/test_ISL.csv` (2,522 samples)

Each sample is a 100x100 grayscale image flattened into 10,000 pixel values with the corresponding letter label (A-Z).

**Image folders** (`dataset_ISL/a/` through `dataset_ISL/z/`) contain the original JPG photographs used to generate the CSV data.

### Dataset Properties

| Property | Value |
|---|---|
| **File** | `data/train_ISL.csv`, `data/test_ISL.csv` |
| **Samples** | 12,636 total (10,114 train + 2,522 test) |
| **Features** | 10,000 per sample (100x100 pixels) |
| **Labels** | A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z |
| **Samples per letter** | ~389-390 (balanced across 26 classes) |

---

## Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI inference server (port 8001) |
| `train_real.py` | Training script for the real dataset |
| `train_model.py` | Training script for synthetic data (legacy) |
| `generate_dataset.py` | Synthetic dataset generator (legacy) |
| `schemas.py` | Pydantic request/response schemas |
| `capture_data.py` | Webcam data collection tool |
| `models/isl_classifier.pkl` | Trained model (joblib, 244 MB) |
| `models/isl_classifier_pickle.pkl` | Trained model (pickle backup) |
| `data/train_ISL.csv` | Training data |
| `data/test_ISL.csv` | Test data |
| `requirements.txt` | Python dependencies |

---

## How to Use

### Start the ML Server

```bash
cd ml
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

### Retrain the Model

```bash
cd ml
python train_real.py
```

### Collect New Training Data

```bash
cd ml
python capture_data.py
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check + model status |
| `/cv/predict` | POST | Predict ISL letter from 10,000 pixel values |
| `/verify-sign` | POST | Verify if a sign matches a target letter |

### Request Format

```json
{
  "pixels": [0.5, 0.3, ..., 0.8],  // 10,000 floats (100x100 grayscale)
  "target_sign": "A"                 // for /verify-sign only
}
```

### Response Format

```json
{
  "predicted_label": "A",
  "confidence": 0.96,
  "is_correct": true,                // for /verify-sign only
  "xp_awarded": 10                   // for /verify-sign only
}
```

---

## Performance

| Letter | Precision | Recall | F1-Score |
|---|---|---|---|
| A | 0.96 | 0.97 | 0.96 |
| B | 0.99 | 0.98 | 0.98 |
| C | 0.96 | 0.95 | 0.95 |
| D | 0.99 | 0.99 | 0.99 |
| E | 0.98 | 0.99 | 0.98 |
| F | 1.00 | 0.99 | 0.99 |
| G | 1.00 | 0.99 | 0.99 |
| H | 0.97 | 1.00 | 0.98 |
| I | 0.99 | 0.99 | 0.99 |
| J | 0.97 | 1.00 | 0.98 |
| K | 1.00 | 0.96 | 0.98 |
| L | 0.95 | 0.91 | 0.93 |
| M | 0.85 | 0.80 | 0.83 |
| N | 0.84 | 0.90 | 0.87 |
| O | 0.98 | 0.99 | 0.98 |
| P | 1.00 | 1.00 | 1.00 |
| Q | 0.97 | 0.97 | 0.97 |
| R | 0.98 | 0.99 | 0.98 |
| S | 0.97 | 0.99 | 0.98 |
| T | 0.96 | 0.98 | 0.97 |
| U | 1.00 | 0.93 | 0.96 |
| V | 0.96 | 0.99 | 0.97 |
| W | 0.98 | 0.95 | 0.96 |
| X | 0.90 | 0.94 | 0.92 |
| Y | 0.99 | 0.99 | 0.99 |
| Z | 0.98 | 0.97 | 0.97 |

**Overall accuracy: 96.51%**
