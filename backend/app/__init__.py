"""
AttendGuard AI 2.0 — Production-grade AI-powered attendance violation detection platform.

Architecture:
    app/
    ├── api/          # FastAPI route handlers
    ├── core/         # Config, security, exceptions, logging
    ├── services/     # Business logic layer
    ├── models/       # MongoDB document models (Pydantic)
    ├── schemas/      # Request/Response DTOs
    ├── repositories/ # Data access layer
    ├── ai/           # AI/NLP integration (HuggingFace)
    ├── vision/       # Computer Vision pipeline (InsightFace)
    ├── database/     # MongoDB connection & indexing
    ├── middleware/    # Request logging, error handling
    └── utils/        # Shared utilities
"""

__version__ = "2.0.0"
