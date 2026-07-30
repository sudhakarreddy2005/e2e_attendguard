"""
Application configuration using Pydantic BaseSettings.

Loads from environment variables and .env file with type validation.
All settings are centralized here — no scattered os.getenv() calls.
"""

from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application-wide configuration. All values can be overridden via env vars."""

    # ── Application ──────────────────────────────────────────────────────
    APP_NAME: str = "AttendGuard"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")

    # ── Server ───────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── MongoDB ──────────────────────────────────────────────────────────
    MONGO_URL: str = "mongodb://localhost:27017/"
    MONGO_DB: str = "v3Db"
    MONGO_MIN_POOL_SIZE: int = 5
    MONGO_MAX_POOL_SIZE: int = 50

    # ── JWT Authentication ───────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-in-production-to-a-secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Security & Authentication ─────────────────────────────────────────
    APP_SECRET: str = "change-this-in-production"
    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # ── Google OAuth & Institutional Identity ───────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = "109876543210-attendguard-vvit.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    ALLOWED_DOMAINS: list[str] = ["vvit.net", "gmail.com"]
    SUPER_ADMIN_EMAIL: str = "23BQ1A05A9@vvit.net"

    # ── Face Recognition ─────────────────────────────────────────────────
    FACE_SIMILARITY_THRESHOLD: float = 0.45
    FACE_MIN_SIZE: int = 40
    FACE_QUALITY_THRESHOLD: float = 0.3
    EMBEDDING_DIMENSION: int = 512
    EMBEDDING_MODEL: str = "buffalo_l"
    RECOGNITION_MAX_FACES: int = 30

    # ── Storage Paths ────────────────────────────────────────────────────
    STORAGE_ROOT: Path = Path("storage")
    STORAGE_TRAINING: Path = Path("storage/training")
    STORAGE_UPLOADS: Path = Path("storage/uploads")
    STORAGE_REPORTS: Path = Path("storage/reports")
    STORAGE_TEMP: Path = Path("storage/temp")

    # ── AI / LLM ─────────────────────────────────────────────────────────
    AI_PROVIDER: str = Field(default="ollama", description="ollama | huggingface | openai | gemini")
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:8b"
    OLLAMA_TIMEOUT: int = 120
    HUGGINGFACE_MODEL: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # ── Logging ──────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_FILE: Optional[str] = None

    # ── Feature Flags ────────────────────────────────────────────────────
    ENABLE_AI_ASSISTANT: bool = True
    ENABLE_AUDIT_LOG: bool = True
    ENABLE_NOTIFICATIONS: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    def ensure_storage_dirs(self) -> None:
        """Create all storage directories if they don't exist."""
        for path_field in [self.STORAGE_ROOT, self.STORAGE_TRAINING,
                           self.STORAGE_UPLOADS, self.STORAGE_REPORTS,
                           self.STORAGE_TEMP]:
            path_field.mkdir(parents=True, exist_ok=True)


# Singleton instance — import this throughout the app
settings = Settings()
