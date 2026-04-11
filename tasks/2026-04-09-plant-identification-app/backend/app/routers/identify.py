import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.providers import get_provider
from app.schemas import IdentifyResponse, ImageMetadata

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/api/identify", response_model=IdentifyResponse)
async def identify_plant(image: UploadFile = File(...)):
    settings = get_settings()

    data = await image.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image exceeds {settings.max_upload_mb} MB limit.")

    content_type = image.content_type or "image/jpeg"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {content_type}. Use JPEG, PNG, or WebP.",
        )

    provider = get_provider(settings)
    result, alternatives = await provider.identify(data, content_type)

    request_id = f"plantreq_{uuid.uuid4().hex[:12]}"

    return IdentifyResponse(
        request_id=request_id,
        received_at=datetime.now(timezone.utc),
        provider=settings.identifier_provider,
        result=result,
        alternatives=alternatives,
        image=ImageMetadata(
            filename=image.filename or "upload",
            content_type=content_type,
            file_size_bytes=len(data),
        ),
    )
