from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "provider": settings.classifier_provider,
    }
