from pydantic import BaseModel, Field
from typing import Optional

class LandmarkPayload(BaseModel):
    """126 floats: 21 landmarks × 3 coordinates (x,y,z) × 2 hands."""
    landmarks: list[float] = Field(..., min_length=126, max_length=126)
    lesson_id: Optional[str] = None

class PredictionOut(BaseModel):
    predicted_label: str
    confidence: float = Field(ge=0.0, le=1.0)