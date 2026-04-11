from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class GrowingTip(BaseModel):
    category: str
    tip: str


class PlantResult(BaseModel):
    common_name: str
    scientific_name: str
    confidence: Literal["high", "medium", "low"]
    description: str
    fun_facts: list[str] = Field(default_factory=list)
    is_houseplant: bool
    growing_tips: list[GrowingTip] = Field(default_factory=list)


class ImageMetadata(BaseModel):
    filename: str
    content_type: str | None = None
    file_size_bytes: int = Field(ge=0)


class IdentifyResponse(BaseModel):
    request_id: str
    received_at: datetime
    provider: str
    result: PlantResult
    alternatives: list[PlantResult] = Field(default_factory=list)
    image: ImageMetadata


class ApiErrorResponse(BaseModel):
    request_id: str
    error: dict[str, str]
