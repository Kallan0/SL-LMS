from pydantic import BaseModel, Field
from typing import Optional

class PixelPayload(BaseModel):
    """10000 floats: 100x100 grayscale pixel values (0-255 or 0-1 normalized)."""
    pixels: list[float] = Field(..., min_length=10000, max_length=10000)
    lesson_id: Optional[str] = None

class VerifySignPayload(BaseModel):
    """Sent by the Assessment page: target sign + pixel floats."""
    target_sign: str
    pixels: list[float] = Field(..., min_length=10000, max_length=10000)

class PredictionOut(BaseModel):
    predicted_label: str
    confidence: float = Field(ge=0.0, le=1.0)

class VerifySignOut(BaseModel):
    """Response shape expected by Assessment.tsx."""
    target_sign: str
    ai_prediction: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_correct: bool
    message: str
    xp_awarded: int
