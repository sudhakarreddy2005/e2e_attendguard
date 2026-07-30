"""
Structured logging configuration.

Provides named loggers for each subsystem:
  - app         : General application events
  - api         : HTTP request/response logging
  - vision      : Face detection and recognition events
  - ai          : AI assistant and report generation
  - audit       : Security and data modification events
  - database    : Database operations
"""

import logging
import sys
from typing import Optional

from app.core.config import settings

# ── Logger Names (import these for consistency) ───────────────────────────
LOGGER_APP = "attendguard"
LOGGER_API = "attendguard.api"
LOGGER_AUTH = "attendguard.auth"
LOGGER_VISION = "attendguard.vision"
LOGGER_AI = "attendguard.ai"
LOGGER_AUDIT = "attendguard.audit"
LOGGER_DATABASE = "attendguard.database"

_configured = False


def setup_logging() -> None:
    """Configure structured logging for the application. Idempotent."""
    global _configured
    if _configured:
        return

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger for the app namespace
    root_logger = logging.getLogger(LOGGER_APP)
    root_logger.setLevel(log_level)

    # Prevent duplicate handlers on reload
    if root_logger.handlers:
        root_logger.handlers.clear()

    # ── Formatter ─────────────────────────────────────────────────────
    if settings.LOG_FORMAT == "json":
        fmt = (
            '{"time":"%(asctime)s","level":"%(levelname)s",'
            '"logger":"%(name)s","message":"%(message)s"}'
        )
    else:
        fmt = "%(asctime)s | %(levelname)-8s | %(name)-24s | %(message)s"

    formatter = logging.Formatter(fmt, datefmt="%Y-%m-%dT%H:%M:%S")

    # ── Console Handler ───────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # ── File Handler (optional) ───────────────────────────────────────
    if settings.LOG_FILE:
        file_handler = logging.FileHandler(settings.LOG_FILE)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Suppress noisy third-party loggers
    for noisy in ["uvicorn.access", "motor", "pymongo"]:
        logging.getLogger(noisy).setLevel(logging.WARNING)

    _configured = True


def get_logger(name: str) -> logging.Logger:
    """Get a named logger within the attendguard namespace."""
    setup_logging()
    return logging.getLogger(name)
