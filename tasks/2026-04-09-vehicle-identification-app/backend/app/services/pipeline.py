from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import UploadFile

from app.schemas import IdentifyResponse, ImageMetadata, ResultSummary
from app.services.classifier import get_classifier_provider

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
}

MAX_DIMENSION = 8000  # px — sanity cap, not resizing


def _validate_image_upload(filename: str, content_type: str | None, file_size_bytes: int, max_mb: int) -> None:
    if file_size_bytes == 0:
        raise ValueError("Uploaded file is empty.")
    if file_size_bytes > max_mb * 1024 * 1024:
        raise ValueError(f"File exceeds the {max_mb} MB limit ({file_size_bytes / 1024 / 1024:.1f} MB received).")

    effective_ct = content_type or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if effective_ct not in ALLOWED_CONTENT_TYPES and ext not in {"jpg", "jpeg", "png", "webp", "gif", "heic", "heif"}:
        raise ValueError(
            f"Unsupported file type '{effective_ct or ext}'. "
            "Please upload a JPEG, PNG, WebP, or HEIC image."
        )


class IdentificationPipeline:
    def run(self, image: UploadFile, image_bytes: bytes) -> IdentifyResponse:
        from app.config import get_settings

        settings = get_settings()
        request_id = f"vehreq_{uuid4().hex[:12]}"

        _validate_image_upload(
            filename=image.filename or "upload.jpg",
            content_type=image.content_type,
            file_size_bytes=len(image_bytes),
            max_mb=settings.max_upload_mb,
        )

        provider = get_classifier_provider()
        predictions = provider.predict(image_bytes=image_bytes, filename=image.filename or "upload.jpg")

        top_match = predictions[0]
        alternatives = predictions[1:3]

        confidence_band = _confidence_band(top_match.confidence)

        headline = _build_headline(top_match)

        return IdentifyResponse(
            request_id=request_id,
            received_at=datetime.now(UTC),
            provider=provider.name,
            summary=ResultSummary(
                headline=headline,
                confidence_band=confidence_band,
                short_description=_summary_description(top_match.confidence, len(alternatives)),
                needs_more_context=confidence_band != "high",
            ),
            top_match=top_match,
            alternatives=alternatives,
            image=ImageMetadata(
                filename=image.filename or "upload.jpg",
                content_type=image.content_type,
                file_size_bytes=len(image_bytes),
            ),
        )


def _build_headline(prediction) -> str:
    parts = [p for p in [prediction.make, prediction.model] if p]
    if prediction.year_range and parts:
        return f"{prediction.year_range} {' '.join(parts)}"
    if parts:
        return " ".join(parts)
    return prediction.vehicle_type.replace("_", " ").title()


def _confidence_band(confidence: float) -> str:
    if confidence >= 0.8:
        return "high"
    if confidence >= 0.55:
        return "medium"
    return "low"


def _summary_description(confidence: float, alternative_count: int) -> str:
    if confidence >= 0.8:
        return "Strong visual match from this photo."
    if alternative_count:
        return "Good lead, but a few similar vehicles are still in play."
    return "Tentative match — a clearer photo would help confirm it."


pipeline = IdentificationPipeline()
