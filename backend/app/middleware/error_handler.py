"""
Global error handling middleware.

Converts AppException subclasses into structured JSON responses.
Catches unhandled exceptions to prevent 500 errors from leaking stack traces.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException
from app.core.logging import get_logger, LOGGER_API

logger = get_logger(LOGGER_API)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(
            "AppException [%s] %s: %s",
            exc.status_code,
            exc.error_code,
            exc.message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception: %s", str(exc), exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                },
            },
        )
