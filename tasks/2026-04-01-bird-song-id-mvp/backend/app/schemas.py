from pydantic import BaseModel, Field


class SpeciesPrediction(BaseModel):
    species_code: str
    common_name: str
    scientific_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class IdentifyResponse(BaseModel):
    provider: str
    top_match: SpeciesPrediction
    alternatives: list[SpeciesPrediction]
    advice: list[str]
