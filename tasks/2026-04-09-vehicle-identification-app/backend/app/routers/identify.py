from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import IdentifyResponse
from app.services.pipeline import pipeline

router = APIRouter(prefix="/api", tags=["identify"])


@router.post("/identify", response_model=IdentifyResponse)
async def identify_vehicle(image: UploadFile = File(...)):
    image_bytes = await image.read()
    request_id = f"vehreq_{uuid4().hex[:12]}"

    try:
        return pipeline.run(image=image, image_bytes=image_bytes)
    except NotImplementedError as exc:
        error = HTTPException(status_code=501, detail=str(exc))
        error.request_id = request_id
        error.error_code = "provider_not_available"
        raise error from exc
    except ValueError as exc:
        error = HTTPException(status_code=400, detail=str(exc))
        error.request_id = request_id
        error.error_code = "bad_image_request"
        raise error from exc
