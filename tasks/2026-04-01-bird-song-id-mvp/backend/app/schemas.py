from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class BirdMetadata(BaseModel):
    family: str | None = None
    habitat: list[str] = Field(default_factory=list)
    diet: list[str] = Field(default_factory=list)
    behavior: list[str] = Field(default_factory=list)
    best_time_to_find: str | None = None
    seasonal_status: str | None = None
    conservation_status: str | None = None
    look_for: list[str] = Field(default_factory=list)


class SpeciesPrediction(BaseModel):
    species_code: str
    common_name: str
    scientific_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    metadata: BirdMetadata | None = None


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


class ResultSummary(BaseModel):
    headline: str
    confidence_band: Literal["high", "medium", "low"]
    short_description: str
    likely_species_count: int = Field(ge=0)
    needs_more_context: bool = False


class ResultFlags(BaseModel):
    used_location_context: bool = False
    used_date_context: bool = False
    has_alternatives: bool = False
    review_recommended: bool = False


class InferenceSummary(BaseModel):
    request_id: str
    received_at: datetime
    provider: str
    summary: ResultSummary
    flags: ResultFlags
    top_match: SpeciesPrediction
    alternatives: list[SpeciesPrediction]
    advice: list[str]
    clip: ClipMetadata


class IdentifyResponse(InferenceSummary):
    pass


class ApiErrorResponse(BaseModel):
    request_id: str
    error: dict[str, str]
