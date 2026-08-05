"""Student API endpoints — CRUD, image serving, analytics."""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response

from app.api.deps import require_permission, require_auth
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
    user: TokenPayload = Depends(require_permission("students.create")),
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

        # Automatically extract and store 512D ArcFace embedding for immediate detection readiness
        try:
            await StudentService.register_student_embedding(roll_no_clean, image_path)
        except Exception as embed_err:
            # If face extraction fails, roll back the created student record
            await StudentService.delete_student(roll_no_clean, deleted_by="system")
            raise HTTPException(status_code=400, detail=str(embed_err))

        return {
            "success": True,
            "roll_no": roll_no_clean,
            "message": "Student registered successfully with 512D ArcFace vision profile",
        }

    except HTTPException:
        raise
    except Exception as e:
        if image_path.exists():
            shutil.rmtree(storage_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to register student: {str(e)}")


@router.get("/")
async def get_students(
    skip: int = 0,
    limit: int = 100,
    user: TokenPayload = Depends(require_permission("students.view")),
):
    """Get student list with automatic HOD department filtering."""
    students = await StudentService.get_students(skip=skip, limit=limit)
    if user.role.upper() == "HOD" and user.department:
        target_dept = user.department.upper().strip()
        students = [
            s for s in students
            if s.get("department", "").upper().strip() == target_dept
        ]
    return students


@router.get("/{roll_no}/image")
async def get_student_image(roll_no: str):
    """Serve a student's registration photo with strict cache control."""
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
        dir_path = settings.STORAGE_TRAINING / dept / section / roll_no.upper()
        if dir_path.exists():
            files = [
                f for f in dir_path.iterdir()
                if f.is_file() and f.suffix.lower() in {".jpeg", ".jpg", ".png"}
            ]
            if files:
                image_path = files[-1]

    if not image_path.exists():
        return {"success": False, "error": "Image not found on server"}

    response = FileResponse(str(image_path), media_type="image/jpeg")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@router.get("/{roll_no}/analytics")
async def get_student_analytics(
    roll_no: str,
    semester: str = None,
    user: TokenPayload = Depends(require_permission("students.view")),
):
    analytics = await StudentService.get_student_analytics(roll_no.upper(), semester=semester)
    if not analytics:
        return {"success": False, "error": "Student not found"}
    return {"success": True, "data": analytics}


@router.put("/{roll_no}")
async def update_student(
    roll_no: str,
    request: Request,
    user: TokenPayload = Depends(require_permission("students.edit")),
):
    """
    Update student profile details.
    - General profile fields can be edited by DEO/Admin.
    - Roll Number (new_roll_no) and Face Photo (image) can ONLY be edited by ADMIN or SUPER_ADMIN.
    - Uploading a new face photo automatically extracts a new 512D ArcFace embedding and removes old embeddings.
    """
    from app.core.exceptions import DuplicateStudentError

    content_type = request.headers.get("content-type", "")

    new_image_bytes = None
    new_image_filename = None
    payload = {}

    if "multipart/form-data" in content_type:
        form = await request.form()
        payload = {k: v for k, v in form.items() if k != "image"}
        image_field = form.get("image")
        if image_field and hasattr(image_field, "read"):
            new_image_bytes = await image_field.read()
            new_image_filename = getattr(image_field, "filename", "updated_face.jpeg")
    else:
        try:
            payload = await request.json()
        except Exception:
            payload = {}

    # Strict role verification: Roll number changes and Face image updates are ADMIN ONLY
    user_role_norm = (user.role or "").upper().replace("_", "")
    is_admin = user_role_norm in ("ADMIN", "SUPERADMIN")

    new_roll = payload.get("new_roll_no") or payload.get("roll_no")
    if new_roll and str(new_roll).strip().upper() != roll_no.strip().upper():
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Only Administrators can modify student Roll Numbers."
            )

    if new_image_bytes and len(new_image_bytes) > 0:
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Only Administrators can update student face registration photos."
            )

    try:
        updated_student = await StudentService.update_student(
            roll_no=roll_no.strip().upper(),
            update_data=payload,
            new_image_bytes=new_image_bytes,
            new_image_filename=new_image_filename,
            updated_by=user.sub,
        )
        return {"success": True, "data": updated_student}
    except StudentNotFoundError:
        return {"success": False, "error": f"Student {roll_no} not found"}
    except DuplicateStudentError as de:
        return {"success": False, "error": str(de)}
    except ValidationError as ve:
        return {"success": False, "error": str(ve)}
    except Exception as e:
        return {"success": False, "error": f"Failed to update student: {str(e)}"}


@router.get("/import-template")
async def download_import_template():
    """Download a sample CSV template for bulk student import."""
    template_content = "Roll_No,Name,Department,Section,Year,Phone,Email\n23BQ1A0501,A.Vidhaya,CSE,A,3rd Year,9515756677,23bq1a0501@vvit.net\n23BQ1A0502,B.Pranay,CSE,A,3rd Year,9876543210,23bq1a0502@vvit.net\n"
    return Response(
        content=template_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=AttendGuard_Student_Import_Template.csv"},
    )


@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    user: TokenPayload = Depends(require_permission("students.create")),
):
    """Bulk import students from CSV or Excel file."""
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
    user: TokenPayload = Depends(require_permission("students.delete")),
):
    """Delete a student profile."""
    try:
        await StudentService.delete_student(roll_no, deleted_by=user.sub)
        return {"success": True, "message": f"Student {roll_no} deleted successfully"}
    except StudentNotFoundError:
        return {"success": False, "error": "Student not found"}
