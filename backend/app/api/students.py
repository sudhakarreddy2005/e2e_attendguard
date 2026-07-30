"""Student API endpoints — CRUD, image serving, analytics."""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.api.deps import require_auth, require_role
from app.core.config import settings
from app.core.exceptions import NoFaceDetectedError, StudentNotFoundError, ValidationError
from app.core.security import TokenPayload
from app.services.student_service import StudentService

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.post("/")
async def register_student(
    name: str = Form(...),
    roll_no: str = Form(...),
    department: str = Form("CSE"),
    section: str = Form("A"),
    year: str = Form(""),
    phone: str = Form(""),
    email: str = Form(""),
    threshold: str = Form("75"),
    image: UploadFile = File(...),
    user: TokenPayload = Depends(require_role("faculty")),
):
    """Register a new student with a face image."""
    roll_no_clean = roll_no.strip().upper()
    dept_clean = department.strip().upper()
    section_clean = section.strip().upper()

    # Save image to storage
    storage_dir = settings.STORAGE_TRAINING / dept_clean / section_clean / roll_no_clean
    storage_dir.mkdir(parents=True, exist_ok=True)

    image_filename = f"{uuid.uuid4().hex}.jpeg"
    image_path = storage_dir / image_filename

    content = await image.read()
    with open(image_path, "wb") as f:
        f.write(content)

    try:
        # The vision pipeline will handle face detection + embedding in Phase 2
        # For now, store as pending_image (will use legacy pipeline as fallback)
        student_data = {
            "name": name,
            "roll_no": roll_no_clean,
            "department": dept_clean,
            "section": section_clean,
            "year": year,
            "phone": phone,
            "email": email,
            "face": {
                "image_filenames": [image_filename],
                "registration_status": "pending_image",
                "image_count": 1,
            },
        }

        student_id = await StudentService.create_student(student_data, created_by=user.sub)

        return {
            "success": True,
            "roll_no": roll_no_clean,
            "message": "Student registered successfully",
        }

    except Exception as e:
        # Cleanup on failure
        if image_path.exists():
            shutil.rmtree(storage_dir, ignore_errors=True)
        raise


@router.get("/")
async def get_students(
    skip: int = 0,
    limit: int = 100,
    user: TokenPayload = Depends(require_auth),
):
    students = await StudentService.get_students(skip=skip, limit=limit)
    return students


@router.get("/{roll_no}/image")
async def get_student_image(roll_no: str):
    """Serve a student's registration photo."""
    try:
        student = await StudentService.get_student_by_roll_no(roll_no.upper())
    except StudentNotFoundError:
        return {"success": False, "error": "Student not found"}

    face_data = student.get("face", {})
    image_filenames = face_data.get("image_filenames", [])
    dept = student.get("department", "")
    section = student.get("section", "")

    if not dept or not section or not image_filenames:
        return {"success": False, "error": "Image profile incomplete"}

    target_filename = image_filenames[-1]
    image_path = settings.STORAGE_TRAINING / dept / section / roll_no.upper() / target_filename

    if not image_path.exists():
        return {"success": False, "error": "Image not found on server"}

    return FileResponse(str(image_path), media_type="image/jpeg")


@router.get("/{roll_no}/analytics")
async def get_student_analytics(
    roll_no: str,
    user: TokenPayload = Depends(require_auth),
):
    analytics = await StudentService.get_student_analytics(roll_no.upper())
    if not analytics:
        return {"success": False, "error": "Student not found"}
    return {"success": True, "data": analytics}


@router.put("/{roll_no}")
async def update_student(
    roll_no: str,
    payload: dict,
    user: TokenPayload = Depends(require_role(["super_admin", "admin", "deo"])),
):
    """
    Update student profile details (name, year, department, section, contact_info).
    Restricted strictly to DEO, Super Admin, and Admin roles.
    """
    try:
        updated_student = await StudentService.update_student(
            roll_no.upper(), payload, updated_by=user.sub
        )
        return {"success": True, "data": updated_student}
    except StudentNotFoundError:
        return {"success": False, "error": "Student not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


from fastapi.responses import FileResponse, Response


@router.get("/import-template")
async def download_import_template():
    """
    Download a sample CSV template for bulk student import.
    """
    template_content = "Roll_No,Name,Department,Section,Year,Phone,Email\n23BQ1A0501,A.Vidhaya,CSE,A,3rd Year,9515756677,23bq1a0501@vvit.net\n23BQ1A0502,B.Pranay,CSE,A,3rd Year,9876543210,23bq1a0502@vvit.net\n"
    return Response(
        content=template_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=AttendGuard_Student_Import_Template.csv"},
    )


@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    user: TokenPayload = Depends(require_role(["super_admin", "admin", "deo"])),
):
    """
    Bulk import students from CSV or Excel (.xlsx / .xls) file.
    Restricted strictly to DEO, Admin, and Super Admin roles.
    """
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        summary = await StudentService.import_students_from_file(
            file_bytes=file_bytes,
            filename=file.filename,
            imported_by=user.sub,
        )
        return {"success": True, "data": summary}
    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process import file: {str(e)}")


@router.delete("/{roll_no}")
async def delete_student(
    roll_no: str,
    user: TokenPayload = Depends(require_role(["super_admin", "admin", "principal", "deo", "hod"])),
):
    """
    Delete a student profile with full database & storage cascading integrity.
    Restricted strictly to Admin, Principal, DEO, and HOD roles.
    """
    try:
        await StudentService.delete_student(roll_no, deleted_by=user.sub)
        return {"success": True, "message": f"Student {roll_no} deleted successfully"}
    except StudentNotFoundError:
        return {"success": False, "error": "Student not found"}

