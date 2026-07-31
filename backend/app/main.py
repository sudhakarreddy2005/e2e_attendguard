"""
AttendGuard 3.0 — FastAPI Application Entry Point

This is the main application file that wires together all layers:
  - CORS configuration
  - Database lifecycle (connect on startup, close on shutdown)
  - Index creation
  - Router registration
  - Middleware registration
  - Exception handler registration
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import get_logger, setup_logging, LOGGER_APP
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.database.indexes import create_indexes, drop_stale_indexes
from app.middleware.error_handler import register_exception_handlers
from app.middleware.request_logging import register_middleware
from app.services.auth_service import AuthService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown events."""
    setup_logging()
    logger = get_logger(LOGGER_APP)
    logger.info("Starting AttendGuard %s (%s)", settings.APP_VERSION, settings.ENVIRONMENT)

    # Startup
    settings.ensure_storage_dirs()
    await connect_to_mongo()
    await drop_stale_indexes()
    await create_indexes()
    await AuthService.ensure_default_admin()

    logger.info("AttendGuard is ready")

    yield

    # Shutdown
    await close_mongo_connection()
    logger.info("AttendGuard shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production-grade AI-powered university student monitoring platform",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Middleware ─────────────────────────────────────────────────────
    register_middleware(app)

    # ── Exception Handlers ────────────────────────────────────────────
    register_exception_handlers(app)

    # ── API Routers ───────────────────────────────────────────────────
    from app.api.auth import router as auth_router
    from app.api.students import router as students_router
    from app.api.violations import router as violations_router
    from app.api.analytics import router as analytics_router
    from app.api.reports import router as reports_router
    from app.api.detection import router as detection_router
    from app.api.extra_routes import search_router, settings_router, notifications_router
    from app.api.ai import router as ai_router
    from app.api.users import router as users_router
    from app.api.student_portal import router as student_portal_router

    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(students_router)
    app.include_router(violations_router)
    app.include_router(analytics_router)
    app.include_router(reports_router)
    app.include_router(detection_router)
    app.include_router(search_router)
    app.include_router(settings_router)
    app.include_router(notifications_router)
    app.include_router(ai_router)
    app.include_router(student_portal_router, prefix="/api")

    # ── Health Check ──────────────────────────────────────────────────
    @app.get("/ping")
    async def ping():
        return {"status": "ok", "version": settings.APP_VERSION}

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "database": settings.MONGO_DB,
        }

    return app


# Application instance — used by uvicorn
app = create_app()
