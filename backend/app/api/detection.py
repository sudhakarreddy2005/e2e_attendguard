"""Detection / Recognition API endpoints — wired to InsightFace pipeline."""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import require_auth
from app.core.config import settings
from app.core.security import TokenPayload

router = APIRouter(prefix="/api/detection", tags=["Detection"])


@router.post("/match")
async def match_student(
    image: UploadFile = File(...),
    department: str = Form(None),
    section: str = Form(None),
    location: str = Form(None),
    period: str = Form(None),
    user: TokenPayload = Depends(require_auth),
):
    """
    Face recognition endpoint using InsightFace pipeline.

    Flow: Image → RetinaFace Detection → ArcFace 512D Embedding → Cosine Similarity Match
    """
    from app.vision.pipeline import recognition_pipeline

    # Save capture for audit
    settings.STORAGE_UPLOADS.mkdir(parents=True, exist_ok=True)
    filename = f"capture_{datetime.now(timezone.utc).timestamp()}.jpg"
    save_path = settings.STORAGE_UPLOADS / filename

    content = await image.read()
    with open(save_path, "wb") as f:
        f.write(content)

    # Run recognition pipeline with multi-face support
    result = await recognition_pipeline.recognize_from_file(
        str(save_path),
        department=department,
        section=section,
        max_faces=10,
    )

    # Inject capture filename for frontend
    result["captured_filename"] = filename

    return result
