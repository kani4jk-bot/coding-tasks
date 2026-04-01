from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod

from app.schemas import SpeciesPrediction
from app.services.mock_birds import MOCK_BIRDS


class ClassifierProvider(ABC):
    name: str

    @abstractmethod
    def predict(self, audio_bytes: bytes, filename: str) -> list[SpeciesPrediction]:
        raise NotImplementedError


class MockClassifierProvider(ClassifierProvider):
    name = "mock"

    def predict(self, audio_bytes: bytes, filename: str) -> list[SpeciesPrediction]:
        if not audio_bytes:
            raise ValueError("Audio payload is empty.")

        digest = hashlib.sha256(audio_bytes + filename.encode("utf-8")).digest()
        birds = list(MOCK_BIRDS)

        scores = []
        for index, bird in enumerate(birds):
            raw = digest[index] / 255
            confidence = round(0.45 + (raw * 0.5), 2)
            scores.append(
                SpeciesPrediction(
                    species_code=bird["species_code"],
                    common_name=bird["common_name"],
                    scientific_name=bird["scientific_name"],
                    confidence=min(confidence, 0.99),
                    reason=bird["reason"],
                )
            )

        return sorted(scores, key=lambda item: item.confidence, reverse=True)


class BirdNetProvider(ClassifierProvider):
    name = "birdnet"

    def predict(self, audio_bytes: bytes, filename: str) -> list[SpeciesPrediction]:
        raise NotImplementedError(
            "BirdNET provider is not implemented yet. Add model loading, audio preprocessing, and window aggregation here."
        )
