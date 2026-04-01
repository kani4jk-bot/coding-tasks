from datetime import date

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import get_settings
from app.schemas import IdentifyContext, IdentifyResponse
from app.services.audio import validate_audio_upload
from app.services.classifier import get_classifier_provider

router = APIRouter(prefix="/api", tags=["identify"])


@router.post("/identify", response_model=IdentifyResponse)
async def identify_bird(
    audio: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    recorded_on: date | None = Form(default=None),
):
    settings = get_settings()

    audio_bytes = await audio.read()
    context = IdentifyContext(latitude=latitude, longitude=longitude, recorded_on=recorded_on)

    try:
        validate_audio_upload(
            filename=audio.filename or "",
            content_type=audio.content_type,
            file_size_bytes=len(audio_bytes),
            max_mb=settings.max_upload_mb,
        )
        provider = get_classifier_provider()
        predictions = provider.predict(audio_bytes=audio_bytes, filename=audio.filename or "upload", context=context)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    top_match = predictions[0]
    alternatives = predictions[1:4]

    advice = [
        "Try a 5–15 second recording with minimal wind noise.",
        "Move closer to the loudest bird and avoid talking during capture.",
    ]
    if not context.latitude or not context.longitude:
        advice.append("Add location to help BirdNET narrow likely species for your area.")
    if not context.recorded_on:
        advice.append("Add the recording date to improve season-aware filtering.")

    return IdentifyResponse(
        provider=provider.name,
        top_match=top_match,
        alternatives=alternatives,
        advice=advice,
    )
