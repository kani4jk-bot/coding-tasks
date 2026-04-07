from datetime import date
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas import IdentifyContext, IdentifyResponse
from app.services.pipeline import pipeline

router = APIRouter(prefix="/api", tags=["identify"])


@router.post("/identify", response_model=IdentifyResponse)
async def identify_bird(
    audio: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    recorded_on: date | None = Form(default=None),
):
    audio_bytes = await audio.read()
    context = IdentifyContext(latitude=latitude, longitude=longitude, recorded_on=recorded_on)
    request_id = f"birdreq_{uuid4().hex[:12]}"

    try:
        return pipeline.run(audio=audio, audio_bytes=audio_bytes, context=context)
    except NotImplementedError as exc:
        error = HTTPException(status_code=501, detail=str(exc))
        error.request_id = request_id
        error.error_code = "provider_not_available"
        raise error from exc
    except ValueError as exc:
        error = HTTPException(status_code=400, detail=str(exc))
        error.request_id = request_id
        error.error_code = "bad_audio_request"
        raise error from exc
