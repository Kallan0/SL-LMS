import os
import joblib
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from schemas import PixelPayload, PredictionOut, VerifySignPayload, VerifySignOut

load_dotenv()

app = FastAPI(title="ISL Sign Language ML Inference Service")

raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins_list = [o.strip() for o in raw_origins.split(",") if o.strip() and o.strip() != "*"]

import re
def _is_localhost(o: str) -> bool:
    return bool(re.match(r"^https?://localhost(:\d+)?$$", o))

def _allow_origin(origin: str) -> str:
    if not origin:
        return "*"
    if not allowed_origins_list:
        if _is_localhost(origin):
            return origin
        return origin
    if origin in allowed_origins_list:
        return origin
    if _is_localhost(origin):
        return origin
    return allowed_origins_list[0] if allowed_origins_list else "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://localhost(:\d+)?$$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model (PCA + Random Forest bundle)
model = None
pca = None
label_encoder = None

MODEL_PATH = os.getenv("MODEL_PATH", "./models/isl_classifier.pkl")

def load_model():
    global model, pca, label_encoder
    if os.path.exists(MODEL_PATH):
        raw = joblib.load(MODEL_PATH)
        if isinstance(raw, dict) and "model" in raw:
            model = raw["model"]
            pca = raw.get("pca")
            label_encoder = raw.get("label_encoder")
        else:
            model = raw
        print(f"ML Model loaded from {MODEL_PATH}")
        if pca:
            print(f"  PCA: {pca.n_features_in_} -> {pca.n_components_} components")
        if label_encoder:
            print(f"  Classes: {', '.join(label_encoder.classes_)}")
    else:
        # Auto-train if model not found (for fresh deployments)
        print(f"Model not found at {MODEL_PATH}. Training from CSV data...")
        train_csv = os.path.join(os.path.dirname(__file__), "data", "train_ISL.csv")
        if os.path.exists(train_csv):
            from train_real import train as train_fn
            train_fn()
            load_model()  # Reload after training
        else:
            print(f"Warning: No training data found at {train_csv}. Model not available.")

load_model()


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "service": "isl-inference",
        "model_loaded": model is not None,
        "model_type": "RF+PCA (10000->150 features)",
    }


@app.post("/cv/predict", response_model=PredictionOut, tags=["computer-vision"])
async def predict_sign(payload: PixelPayload):
    """Predict ISL letter from 10000 pixel values (100x100 grayscale)."""
    if model is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded")

    pixels = np.array(payload.pixels, dtype=np.float32).reshape(1, -1)

    # Normalize if values are > 1 (raw 0-255)
    if pixels.max() > 1.0:
        pixels = pixels / 255.0

    # Apply PCA if available
    if pca is not None:
        features = pca.transform(pixels)
    else:
        features = pixels

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    confidence = float(np.max(probabilities))

    predicted_label = str(label_encoder.inverse_transform([prediction])[0]) if label_encoder else str(prediction)

    return PredictionOut(
        predicted_label=predicted_label,
        confidence=round(confidence, 4),
    )


@app.post("/verify-sign", response_model=VerifySignOut, tags=["computer-vision"])
async def verify_sign(payload: VerifySignPayload):
    """Verify whether the user's sign matches the target letter.
    
    Called by Assessment.tsx with { target_sign, pixels: [10000 floats] }.
    """
    pixels = np.array(payload.pixels, dtype=np.float32).reshape(1, -1)

    # Normalize if values are > 1
    if pixels.max() > 1.0:
        pixels = pixels / 255.0

    if model is not None and pca is not None:
        features = pca.transform(pixels)
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        predicted_label = str(label_encoder.inverse_transform([prediction])[0]) if label_encoder else str(prediction)
    else:
        predicted_label = "?"
        confidence = 0.0

    is_correct = predicted_label.lower() == payload.target_sign.lower()

    return VerifySignOut(
        target_sign=payload.target_sign,
        ai_prediction=predicted_label,
        confidence=round(confidence, 4),
        is_correct=is_correct,
        message="Perfect match!" if is_correct else f"Detected '{predicted_label}' — try again.",
        xp_awarded=10 if is_correct else 0,
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    print(f"Starting ISL ML Inference server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
