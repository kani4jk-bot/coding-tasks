from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import UploadFile

from app.config import get_settings
from app.schemas import ClipMetadata, IdentifyContext, IdentifyResponse
from app.services.audio import validate_audio_upload
from app.services.classifier import get_classifier_provider


class IdentificationPipeline:
    def run(self, audio: UploadFile, audio_bytes: bytes, context: IdentifyContext) -> IdentifyResponse:
        settings = get_settings()

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

        return IdentifyResponse(
            request_id=f"birdreq_{uuid4().hex[:12]}",
            received_at=datetime.now(UTC),
            provider=provider.name,
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


pipeline = IdentificationPipeline()
