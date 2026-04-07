from datetime import date

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

    try:
        return pipeline.run(audio=audio, audio_bytes=audio_bytes, context=context)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
