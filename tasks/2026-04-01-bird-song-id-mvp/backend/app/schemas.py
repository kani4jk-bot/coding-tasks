from datetime import date, datetime

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


class ClipMetadata(BaseModel):
    filename: str
    content_type: str | None = None
    file_size_bytes: int = Field(ge=0)
    latitude: float | None = None
    longitude: float | None = None
    recorded_on: date | None = None


class InferenceSummary(BaseModel):
    request_id: str
    received_at: datetime
    provider: str
    top_match: SpeciesPrediction
    alternatives: list[SpeciesPrediction]
    advice: list[str]
    clip: ClipMetadata


class IdentifyResponse(InferenceSummary):
    pass
