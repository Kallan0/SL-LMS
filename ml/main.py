import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from schemas import LandmarkPayload, PredictionOut

load_dotenv()

app = FastAPI(title="Sign Language ML Inference Service")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "./models/sign_classifier.pkl")

# Load model globally on startup
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"ML Model loaded successfully from {MODEL_PATH}")
else:
    print(f"Warning: Model file not found at {MODEL_PATH}")

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "ml-inference", "model_loaded": model is not None}

@app.post("/cv/predict", response_model=PredictionOut, tags=["computer-vision"])
async def predict_sign(payload: LandmarkPayload):
    if model is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded")

    # Format the 126 coordinates into a 2D array for Scikit-Learn
    input_features = np.array(payload.landmarks).reshape(1, -1)
    
    # Run prediction
    prediction = model.predict(input_features)[0]
    probabilities = model.predict_proba(input_features)[0]
    confidence = float(np.max(probabilities))

    return PredictionOut(
        predicted_label=str(prediction),
        confidence=round(confidence, 2)
    )