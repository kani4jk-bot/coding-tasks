from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()


@router.get("/api/health")
async def health():
    settings = get_settings()
    return {"status": "ok", "provider": settings.identifier_provider}
