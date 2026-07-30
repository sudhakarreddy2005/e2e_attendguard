"""
Request logging middleware.

Logs every API request with method, path, status code, and duration.
"""

import time

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.logging import get_logger, LOGGER_API

logger = get_logger(LOGGER_API)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.time()

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        # Skip health check noise
        if request.url.path not in ("/ping", "/health"):
            logger.info(
                "%s %s → %d (%.1fms)",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

        response.headers["X-Process-Time"] = f"{duration_ms:.1f}ms"
        return response


def register_middleware(app: FastAPI) -> None:
    """Register all middleware on the FastAPI app."""
    app.add_middleware(RequestLoggingMiddleware)
