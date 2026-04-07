from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import httpx
from fastapi import UploadFile

from app.config import get_settings
from app.schemas import BirdMetadata, ClipMetadata, IdentifyContext, IdentifyResponse, ResultFlags, ResultSummary
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

        description, image_url = self._fetch_wikipedia(top_match.common_name, top_match.scientific_name)
        if description or image_url:
            base_meta = top_match.metadata or BirdMetadata()
            top_match = top_match.model_copy(update={
                "metadata": base_meta.model_copy(update={k: v for k, v in {"description": description, "image_url": image_url}.items() if v})
            })

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

    def _fetch_wikipedia(self, common_name: str, scientific_name: str) -> tuple[str | None, str | None]:
        for query in [scientific_name, common_name]:
            if not query or query.lower() in ("unknown", "unknown bird"):
                continue
            try:
                title = query.strip().replace(" ", "_")
                resp = httpx.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}",
                    timeout=3.0,
                    headers={"User-Agent": "BirdsongID/1.0 (bird identification app)"},
                    follow_redirects=True,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    extract = (data.get("extract") or "").strip()
                    image_url = (data.get("thumbnail") or {}).get("source")
                    if extract:
                        if len(extract) > 420:
                            extract = extract[:420].rsplit(" ", 1)[0] + "…"
                        return extract, image_url
            except Exception:
                pass
        return None, None

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
