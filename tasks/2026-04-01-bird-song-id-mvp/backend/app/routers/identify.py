from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.schemas import IdentifyResponse
from app.services.audio import validate_audio_upload
from app.services.classifier import get_classifier_provider

router = APIRouter(prefix="/api", tags=["identify"])


@router.post("/identify", response_model=IdentifyResponse)
async def identify_bird(audio: UploadFile = File(...)):
    settings = get_settings()

    audio_bytes = await audio.read()

    try:
        validate_audio_upload(
            filename=audio.filename or "",
            content_type=audio.content_type,
            file_size_bytes=len(audio_bytes),
            max_mb=settings.max_upload_mb,
        )
        provider = get_classifier_provider()
        predictions = provider.predict(audio_bytes=audio_bytes, filename=audio.filename or "upload")
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    top_match = predictions[0]
    alternatives = predictions[1:4]

    return IdentifyResponse(
        provider=provider.name,
        top_match=top_match,
        alternatives=alternatives,
        advice=[
            "Try a 5–15 second recording with minimal wind noise.",
            "Move closer to the loudest bird and avoid talking during capture.",
            "Location and season can greatly improve final ranking in a future version.",
        ],
    )
