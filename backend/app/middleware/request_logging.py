"""
Request logging middleware.

Logs every API request with method, path, status code, and duration.
"""

import time
import uuid

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
        
        # Correlation ID management
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        # Skip health check noise
        if request.url.path not in ("/ping", "/health", "/health/live", "/health/ready"):
            logger.info(
                "[%s] %s %s → %d (%.1fms)",
                correlation_id[:8],
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

        response.headers["X-Process-Time"] = f"{duration_ms:.1f}ms"
        response.headers["X-Correlation-ID"] = correlation_id
        return response


def register_middleware(app: FastAPI) -> None:
    """Register all middleware on the FastAPI app."""
    app.add_middleware(RequestLoggingMiddleware)

