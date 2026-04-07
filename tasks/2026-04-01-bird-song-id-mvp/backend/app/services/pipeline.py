from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import UploadFile

from app.config import get_settings
from app.schemas import ClipMetadata, IdentifyContext, IdentifyResponse, ResultFlags, ResultSummary
from app.services.audio import validate_audio_upload
from app.services.classifier import get_classifier_provider


class IdentificationPipeline:
    def run(self, audio: UploadFile, audio_bytes: bytes, context: IdentifyContext) -> IdentifyResponse:
        settings = get_settings()
        request_id = f"birdreq_{uuid4().hex[:12]}"

        validate_audio_upload(
            filename=audio.filename or "",
            content_type=audio.content_type,
            file_size_bytes=len(audio_bytes),
            max_mb=settings.max_upload_mb,
        )

        provider = get_classifier_provider()
        predictions = provider.predict(audio_bytes=audio_bytes, filename=audio.filename or "upload", context=context)
        top_match = predictions[0]
        alternatives = predictions[1:4]

        advice = [
            "Try a 5–15 second recording with minimal wind noise.",
            "Move closer to the loudest bird and avoid talking during capture.",
        ]
        if context.latitude is None or context.longitude is None:
            advice.append("Add location to help BirdNET narrow likely species for your area.")
        if not context.recorded_on:
            advice.append("Add the recording date to improve season-aware filtering.")
        if top_match.confidence < 0.7:
            advice.append("Review the alternatives too — this clip looks plausible, but not fully decisive.")

        confidence_band = self._confidence_band(top_match.confidence)
        needs_more_context = confidence_band != "high" or context.latitude is None or context.longitude is None or not context.recorded_on

        return IdentifyResponse(
            request_id=request_id,
            received_at=datetime.now(UTC),
            provider=provider.name,
            summary=ResultSummary(
                headline=top_match.common_name,
                confidence_band=confidence_band,
                short_description=self._summary_description(top_match.confidence, len(alternatives)),
                likely_species_count=1 + len(alternatives),
                needs_more_context=needs_more_context,
            ),
            flags=ResultFlags(
                used_location_context=context.latitude is not None and context.longitude is not None,
                used_date_context=bool(context.recorded_on),
                has_alternatives=bool(alternatives),
                review_recommended=confidence_band != "high",
            ),
            top_match=top_match,
            alternatives=alternatives,
            advice=advice,
            clip=ClipMetadata(
                filename=audio.filename or "upload",
                content_type=audio.content_type,
                file_size_bytes=len(audio_bytes),
                latitude=context.latitude,
                longitude=context.longitude,
                recorded_on=context.recorded_on,
            ),
        )

    def _confidence_band(self, confidence: float) -> str:
        if confidence >= 0.8:
            return "high"
        if confidence >= 0.55:
            return "medium"
        return "low"

    def _summary_description(self, confidence: float, alternative_count: int) -> str:
        if confidence >= 0.8:
            return "Strong match from the current clip."
        if alternative_count:
            return "Good lead, but a few similar birds are still in play."
        return "Tentative match — another clip would help confirm it."


pipeline = IdentificationPipeline()
