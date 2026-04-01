from __future__ import annotations

import hashlib
import shutil
from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from app.config import get_settings
from app.schemas import IdentifyContext, SpeciesPrediction
from app.services.audio import normalize_audio_for_birdnet, write_upload_to_temp
from app.services.mock_birds import MOCK_BIRDS


class ClassifierProvider(ABC):
    name: str

    @abstractmethod
    def predict(self, audio_bytes: bytes, filename: str, context: IdentifyContext | None = None) -> list[SpeciesPrediction]:
        raise NotImplementedError


class MockClassifierProvider(ClassifierProvider):
    name = "mock"

    def predict(self, audio_bytes: bytes, filename: str, context: IdentifyContext | None = None) -> list[SpeciesPrediction]:
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

    def predict(self, audio_bytes: bytes, filename: str, context: IdentifyContext | None = None) -> list[SpeciesPrediction]:
        try:
            from birdnetlib import Recording
            from birdnetlib.analyzer import Analyzer
        except Exception as exc:
            raise NotImplementedError(
                "BirdNET provider dependencies are incomplete. Install the optional BirdNET stack (birdnetlib + librosa/soundfile + TensorFlow Lite or compatible runtime). "
                f"Underlying error: {exc}"
            ) from exc

        settings = get_settings()
        input_path = write_upload_to_temp(audio_bytes, filename)
        normalized_path: Path | None = None

        try:
            normalized_path = normalize_audio_for_birdnet(input_path)
            analyzer = Analyzer()
            recording_args = {
                "lat": context.latitude if context else None,
                "lon": context.longitude if context else None,
                "date": datetime.combine(context.recorded_on, datetime.min.time()) if context and context.recorded_on else None,
                "min_conf": settings.birdnet_min_confidence,
            }
            recording = Recording(
                analyzer,
                str(normalized_path),
                **{key: value for key, value in recording_args.items() if value is not None},
            )
            recording.analyze()
            predictions = self._aggregate_detections(recording.detections, settings.birdnet_top_n)
            if not predictions:
                raise ValueError(
                    "BirdNET ran successfully but found no bird detections above the current confidence threshold. Try a cleaner 5–15 second clip."
                )
            return predictions
        finally:
            shutil.rmtree(input_path.parent, ignore_errors=True)

    def _aggregate_detections(self, detections: list[dict], top_n: int) -> list[SpeciesPrediction]:
        grouped: dict[str, dict] = defaultdict(lambda: {
            "common_name": "Unknown bird",
            "scientific_name": "Unknown",
            "scores": [],
            "windows": [],
        })

        for detection in detections:
            common_name = detection.get("common_name") or "Unknown bird"
            scientific_name = detection.get("scientific_name") or "Unknown"
            label = detection.get("label") or f"{scientific_name}_{common_name}"
            species_code = self._species_code(scientific_name, common_name)
            confidence = float(detection.get("confidence") or 0.0)
            window = (detection.get("start_time"), detection.get("end_time"))

            entry = grouped[species_code]
            entry["common_name"] = common_name
            entry["scientific_name"] = scientific_name
            entry["label"] = label
            entry["scores"].append(confidence)
            entry["windows"].append(window)

        ranked: list[SpeciesPrediction] = []
        for species_code, entry in grouped.items():
            scores = sorted(entry["scores"], reverse=True)
            peak = scores[0]
            mean_top = sum(scores[:3]) / min(len(scores), 3)
            confidence = round(min(0.99, (peak * 0.65) + (mean_top * 0.35)), 3)
            start, end = self._best_window(entry["windows"])
            ranked.append(
                SpeciesPrediction(
                    species_code=species_code,
                    common_name=entry["common_name"],
                    scientific_name=entry["scientific_name"],
                    confidence=confidence,
                    reason=(
                        f"BirdNET detected this species in {len(scores)} time window(s); "
                        f"strongest hit around {start:.1f}–{end:.1f}s."
                    ),
                )
            )

        return sorted(ranked, key=lambda item: item.confidence, reverse=True)[:top_n]

    def _best_window(self, windows: list[tuple[float | None, float | None]]) -> tuple[float, float]:
        for start, end in windows:
            if start is not None and end is not None:
                return float(start), float(end)
        return 0.0, 0.0

    def _species_code(self, scientific_name: str, common_name: str) -> str:
        text = scientific_name or common_name or "unknown-bird"
        return "".join(ch for ch in text.lower() if ch.isalpha())[:10] or "unknown"
