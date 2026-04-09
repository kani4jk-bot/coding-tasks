from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.routers.health import router as health_router
from app.routers.identify import router as identify_router

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    request_id = getattr(exc, "request_id", "vehreq_error")
    code = getattr(exc, "error_code", f"http_{exc.status_code}")
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "request_id": request_id,
            "error": {"code": code, "message": detail},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    message = first_error.get("msg", "Request validation failed.")
    return JSONResponse(
        status_code=422,
        content={
            "request_id": "vehreq_validation",
            "error": {"code": "validation_error", "message": message},
        },
    )


app.include_router(health_router)
app.include_router(identify_router)
