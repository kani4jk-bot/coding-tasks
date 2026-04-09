from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class VehiclePrediction(BaseModel):
    vehicle_type: str  # car, truck, motorcycle, bicycle, plane, train, boat, etc.
    make: str | None = None
    model: str | None = None
    year_range: str | None = None
    country_of_origin: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    fun_facts: list[str] = Field(default_factory=list)
    specs: dict[str, str] = Field(default_factory=dict)
    brief_history: str | None = None


class ImageMetadata(BaseModel):
    filename: str
    content_type: str | None = None
    file_size_bytes: int = Field(ge=0)


class ResultSummary(BaseModel):
    headline: str
    confidence_band: Literal["high", "medium", "low"]
    short_description: str
    needs_more_context: bool = False


class IdentifyResponse(BaseModel):
    request_id: str
    received_at: datetime
    provider: str
    summary: ResultSummary
    top_match: VehiclePrediction
    alternatives: list[VehiclePrediction]
    image: ImageMetadata


class ApiErrorResponse(BaseModel):
    request_id: str
    error: dict[str, str]
