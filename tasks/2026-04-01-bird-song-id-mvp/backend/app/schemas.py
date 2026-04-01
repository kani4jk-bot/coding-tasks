from datetime import date

from pydantic import BaseModel, Field


class SpeciesPrediction(BaseModel):
    species_code: str
    common_name: str
    scientific_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class IdentifyContext(BaseModel):
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
    recorded_on: date | None = None


class IdentifyResponse(BaseModel):
    provider: str
    top_match: SpeciesPrediction
    alternatives: list[SpeciesPrediction]
    advice: list[str]
