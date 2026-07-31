"""Detection / Recognition API endpoints — wired to InsightFace pipeline."""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import require_permission
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
    user: TokenPayload = Depends(require_permission("recognition.scan")),
):
    """
    Face recognition endpoint using InsightFace pipeline.
    """
    from app.vision.pipeline import recognition_pipeline

    settings.STORAGE_UPLOADS.mkdir(parents=True, exist_ok=True)
    filename = f"capture_{datetime.now(timezone.utc).timestamp()}.jpg"
    save_path = settings.STORAGE_UPLOADS / filename

    content = await image.read()
    with open(save_path, "wb") as f:
        f.write(content)

    result = await recognition_pipeline.recognize_from_file(
        str(save_path),
        department=department,
        section=section,
        max_faces=10,
    )

    result["captured_filename"] = filename
    return result
