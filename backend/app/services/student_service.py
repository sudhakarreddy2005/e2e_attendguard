"""
Student service — business logic for student management.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.exceptions import (
    DuplicateStudentError,
    StudentNotFoundError,
    ValidationError,
)
from app.core.logging import get_logger, LOGGER_APP
from app.repositories.student_repository import student_repo
from app.repositories.common_repositories import audit_repo

logger = get_logger(LOGGER_APP)


class StudentService:

    @staticmethod
    async def create_student(student_data: dict, created_by: str = "system") -> str:
        """Register a new student."""
        roll_no = str(student_data.get("roll_no", "")).strip().upper()
        if not roll_no:
            raise ValidationError("Roll number is required")

        name = str(student_data.get("name", "")).strip().title()
        if not name:
            raise ValidationError("Student name is required")

        # Check duplicate
        existing = await student_repo.find_by_roll_no(roll_no)
        if existing:
            raise DuplicateStudentError(
                f"Student with roll number {roll_no} is already registered"
            )

        dept = str(student_data.get("department", "CSE")).strip().upper()
        section = str(student_data.get("section", "A")).strip().upper()

        doc = {
            "roll_no": roll_no,
            "name": name,
            "department": dept,
            "section": section,
            "year": str(student_data.get("year", "")).strip(),
            "contact_info": {
                "phone": str(student_data.pop("phone", "")).strip(),
                "email": str(student_data.pop("email", "")).strip(),
            },
            "face": student_data.get("face", {
                "image_filenames": [],
                "registration_status": "pending_image",
                "image_count": 0,
            }),
            "violations_count": 0,
            "late_count": 0,
            "bunk_count": 0,
            "dress_code_count": 0,
            "attendance_percentage": 0.0,
            "metadata": student_data.get("metadata", {}),
        }

        # Ensure storage directory exists
        storage_path = settings.STORAGE_TRAINING / dept / section / roll_no
        storage_path.mkdir(parents=True, exist_ok=True)

        student_id = await student_repo.insert_one(doc)

        await audit_repo.log_action(
            user=created_by,
            action="create",
            entity_type="student",
            entity_id=student_id,
            description=f"Registered student {roll_no} ({name})",
        )

        logger.info("Registered student: %s (%s)", roll_no, name)
        return student_id

    @staticmethod
    async def get_students(filters: Optional[dict] = None, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get all students, optionally filtered and paginated."""
        return await student_repo.find_many(filters, skip=skip, limit=limit)

    @staticmethod
    async def get_student_by_roll_no(roll_no: str) -> dict:
        student = await student_repo.find_by_roll_no(roll_no)
        if not student:
            raise StudentNotFoundError(f"Student {roll_no} not found")
        return student

    @staticmethod
    async def update_student_face(
        roll_no: str,
        image_filenames: list[str],
        registration_status: str = "active",
    ) -> bool:
        """Update face registration metadata."""
        return await student_repo.update_one(
            {"roll_no": roll_no.upper()},
            {
                "$set": {
                    "face.image_filenames": image_filenames,
                    "face.registration_status": registration_status,
                    "face.image_count": len(image_filenames),
                },
            },
        )

    @staticmethod
    async def register_student_embedding(roll_no: str, image_path: Path) -> dict:
        """Extract 512D ArcFace embedding from student photo and store in face_embeddings collection."""
        import cv2
        from app.vision.detector import detector
        from app.vision.preprocessor import preprocessor
        from app.repositories.embedding_repository import embedding_repo

        image = cv2.imread(str(image_path))
        if image is None:
            raise ValidationError("Invalid image file format")

        quality = preprocessor.assess_quality(image)
        processed = preprocessor.preprocess(image)
        faces = detector.detect(processed, max_faces=1)

        if not faces or faces[0].get("embedding") is None:
            raise ValidationError("No clear face detected in the registration photo. Please provide a clear facial photo of the student.")

        embedding = faces[0]["embedding"]

        # Clear any existing embeddings for this student to keep primary embedding clean
        await embedding_repo.delete_by_student(roll_no.upper())

        embed_doc = {
            "student_id": roll_no.upper(),
            "embedding": embedding,
            "embedding_dimension": len(embedding),
            "embedding_model": "arcface",
            "model_version": settings.EMBEDDING_MODEL,
            "quality_score": quality.get("overall_quality", 1.0),
            "blur_score": quality.get("blur_score", 100.0),
            "lighting_score": quality.get("lighting_score", 1.0),
            "image_path": str(image_path),
            "image_filename": image_path.name,
            "is_primary": True,
            "status": "active",
        }
        await embedding_repo.insert_one(embed_doc)

        await student_repo.update_one(
            {"roll_no": roll_no.upper()},
            {
                "$set": {
                    "face.registration_status": "active",
                    "face.image_count": 1,
                }
            },
        )
        logger.info("Generated and stored 512D ArcFace embedding for student %s", roll_no)
        return embed_doc

    @staticmethod
    async def get_student_analytics(
        roll_no: str, semester: Optional[str] = None
    ) -> Optional[dict]:
        """Get violation analytics for a specific student, optionally filtered by semester."""
        from app.repositories.violation_repository import violation_repo

        roll_clean = roll_no.upper().strip()
        student = await student_repo.find_by_roll_no(roll_clean)
        if not student:
            return None

        # Filter query for violations
        match_filter: dict = {"roll_no": roll_clean}
        if semester:
            active_sem = student.get("current_semester", "3-2")
            if semester == active_sem:
                match_filter["$or"] = [
                    {"semester": semester},
                    {"semester": None},
                    {"semester": {"$exists": False}},
                ]
            else:
                match_filter["semester"] = semester

        # Violation records
        violations = await violation_repo.find_many(match_filter)
        total_violations = len(violations)

        # Monthly trend (trailing 12 months)
        monthly_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": {"$month": "$created_at"}, "count": {"$sum": 1}}},
        ]
        month_aggregates = await violation_repo.aggregate(monthly_pipeline)

        month_map = {
            1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
        }

        current_month = datetime.now(timezone.utc).month
        chart_labels = []
        chart_data = []
        for i in range(11, -1, -1):
            m = current_month - i
            if m <= 0:
                m += 12
            chart_labels.append(month_map[m])
            matched = next((item["count"] for item in month_aggregates if item["_id"] == m), 0)
            chart_data.append(matched)

        # Violation breakdown by type
        breakdown_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        breakdown_agg = await violation_repo.aggregate(breakdown_pipeline)
        breakdown = {doc["_id"]: doc["count"] for doc in breakdown_agg if doc["_id"]}

        # Timeline (sorted DESC)
        timeline = []
        for v in sorted(violations, key=lambda x: x.get("created_at", datetime.min) or datetime.min, reverse=True):
            dt = v.get("created_at")
            formatted_date = dt.strftime("%b %d, %Y %I:%M %p") if hasattr(dt, "strftime") else str(dt)
            timeline.append({
                "id": str(v.get("_id", "")),
                "type": v.get("type", "Unknown"),
                "date": formatted_date,
                "remark": v.get("remarks", "No remarks provided."),
                "location": v.get("location", "Unknown Location"),
                "status": v.get("status", "Pending"),
                "semester": v.get("semester", "3-2"),
            })

        return {
            "total": total_violations,
            "monthly_counts": {"labels": chart_labels, "data": chart_data},
            "breakdown": breakdown,
            "timeline": timeline,
        }

    @staticmethod
    async def update_student(
        roll_no: str,
        update_data: dict,
        new_image_bytes: Optional[bytes] = None,
        new_image_filename: Optional[str] = None,
        updated_by: str = "system",
    ) -> dict:
        """
        Update student profile fields. Supports:
          - Modifying roll_no with cascading database & filesystem storage directory updates
          - Uploading a new face photo, extracting 512D ArcFace embedding, replacing old embeddings
          - Standard field updates (name, year, department, section, contact_info)
        """
        import shutil
        from app.repositories.embedding_repository import embedding_repo
        from app.repositories.violation_repository import violation_repo

        roll_no_clean = roll_no.strip().upper()
        student = await student_repo.find_by_roll_no(roll_no_clean)
        if not student:
            raise StudentNotFoundError(f"Student {roll_no_clean} not found")

        old_dept = student.get("department", "CSE").upper()
        old_sec = student.get("section", "A").upper()

        new_roll = update_data.get("new_roll_no") or update_data.get("roll_no")
        target_roll = roll_no_clean
        if new_roll and str(new_roll).strip().upper() != roll_no_clean:
            target_roll = str(new_roll).strip().upper()
            existing = await student_repo.find_by_roll_no(target_roll)
            if existing:
                raise DuplicateStudentError(f"Roll number {target_roll} is already registered to another student")

        target_dept = str(update_data.get("department", old_dept)).strip().upper()
        target_sec = str(update_data.get("section", old_sec)).strip().upper()

        # Handle storage directory migration for student training images
        old_storage_dir = settings.STORAGE_TRAINING / old_dept / old_sec / roll_no_clean
        new_storage_dir = settings.STORAGE_TRAINING / target_dept / target_sec / target_roll
        new_storage_dir.mkdir(parents=True, exist_ok=True)

        if old_storage_dir.exists() and old_storage_dir.resolve() != new_storage_dir.resolve():
            for item in old_storage_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, new_storage_dir / item.name)
            shutil.rmtree(old_storage_dir, ignore_errors=True)

        fields_to_update: dict = {}
        if target_roll != roll_no_clean:
            fields_to_update["roll_no"] = target_roll

        if "name" in update_data and update_data["name"]:
            fields_to_update["name"] = str(update_data["name"]).strip().title()

        if "year" in update_data and update_data["year"]:
            fields_to_update["year"] = str(update_data["year"]).strip()

        if "department" in update_data and update_data["department"]:
            fields_to_update["department"] = target_dept

        if "section" in update_data and update_data["section"]:
            fields_to_update["section"] = target_sec

        phone = update_data.get("phone")
        email = update_data.get("email")
        if phone is not None or email is not None:
            contact_info = student.get("contact_info", {})
            if phone is not None:
                contact_info["phone"] = str(phone).strip()
            if email is not None:
                contact_info["email"] = str(email).strip()
            fields_to_update["contact_info"] = contact_info

        # Handle new registration face image upload & 512D ArcFace re-embedding
        if new_image_bytes:
            import uuid
            # Clean out old photo files in storage directory to avoid serving stale images
            if new_storage_dir.exists():
                for old_f in new_storage_dir.glob("*.*"):
                    if old_f.is_file() and old_f.suffix.lower() in {".jpeg", ".jpg", ".png"}:
                        try:
                            old_f.unlink()
                        except Exception:
                            pass

            image_fn = f"{uuid.uuid4().hex}.jpeg"
            img_save_path = new_storage_dir / image_fn
            with open(img_save_path, "wb") as f:
                f.write(new_image_bytes)

            # Extract new embedding & delete old embeddings for this student
            await StudentService.register_student_embedding(target_roll, img_save_path)

            fields_to_update["face"] = {
                "image_filenames": [image_fn],
                "registration_status": "active",
                "image_count": 1,
            }

        fields_to_update["updated_at"] = datetime.now(timezone.utc)

        await student_repo.update_one(
            {"roll_no": roll_no_clean},
            {"$set": fields_to_update},
        )

        # If roll_no changed, perform cascading updates across all collections
        if target_roll != roll_no_clean:
            await embedding_repo.collection.update_many(
                {"student_id": roll_no_clean},
                {"$set": {"student_id": target_roll}},
            )
            await violation_repo.collection.update_many(
                {"roll_no": roll_no_clean},
                {"$set": {"roll_no": target_roll}},
            )

        await audit_repo.log_action(
            user=updated_by,
            action="update",
            entity_type="student",
            entity_id=target_roll,
            description=f"Updated student profile for {target_roll} (was {roll_no_clean}): {list(fields_to_update.keys())}",
        )

        logger.info("Updated student profile for %s (target: %s) by %s", roll_no_clean, target_roll, updated_by)
        return await student_repo.find_by_roll_no(target_roll)

    @staticmethod
    async def search_students(query: str, limit: int = 20) -> list[dict]:
        return await student_repo.search(query, limit)

    @staticmethod
    async def import_students_from_file(
        file_bytes: bytes,
        filename: str,
        imported_by: str = "system",
    ) -> dict:
        """
        Import or update students in bulk from CSV or Excel (.xlsx/.xls) file.
        Flexible header matching for roll_no, name, department, section, year, phone, email.
        """
        import io
        import csv

        rows = []
        is_excel = filename.lower().endswith((".xlsx", ".xls"))

        if is_excel:
            try:
                import openpyxl
                wb = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), data_only=True)
                sheet = wb.active
                raw_rows = list(sheet.iter_rows(values_only=True))
                if raw_rows:
                    headers = [str(h).strip().lower() if h is not None else "" for h in raw_rows[0]]
                    for row_vals in raw_rows[1:]:
                        if not any(row_vals):
                            continue
                        row_dict = {}
                        for idx, h in enumerate(headers):
                            val = row_vals[idx] if idx < len(row_vals) else ""
                            row_dict[h] = str(val).strip() if val is not None else ""
                        rows.append(row_dict)
            except Exception as exc:
                raise ValidationError(f"Failed to parse Excel file: {str(exc)}")
        else:
            # CSV processing
            try:
                text_content = file_bytes.decode("utf-8-sig", errors="replace")
                reader = csv.DictReader(io.StringIO(text_content))
                for row in reader:
                    cleaned_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k}
                    rows.append(cleaned_row)
            except Exception as exc:
                raise ValidationError(f"Failed to parse CSV file: {str(exc)}")

        if not rows:
            raise ValidationError("File is empty or contains no valid rows.")

        total_rows = len(rows)
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        def find_val(r_dict: dict, keys: list[str]) -> str:
            for k in keys:
                for rk, rv in r_dict.items():
                    if k in rk:
                        return rv
            return ""

        for row_idx, r in enumerate(rows, start=2):
            roll_no = find_val(r, ["roll_no", "rollno", "roll", "student_id", "id"]).upper()
            name = find_val(r, ["name", "student_name", "full_name"]).title()

            if not roll_no or not name:
                errors.append(f"Row {row_idx}: Missing required Roll No or Name (Roll: '{roll_no}', Name: '{name}')")
                skipped_count += 1
                continue

            dept = find_val(r, ["department", "dept", "branch"]).upper() or "CSE"
            section = find_val(r, ["section", "sec", "sec_name"]).upper() or "A"
            year = find_val(r, ["year", "academic_year", "class"]) or "3rd Year"
            phone = find_val(r, ["phone", "mobile", "contact"])
            email = find_val(r, ["email", "mail"])

            existing = await student_repo.find_by_roll_no(roll_no)
            if existing:
                await StudentService.update_student(
                    roll_no,
                    {
                        "name": name,
                        "department": dept,
                        "section": section,
                        "year": year,
                        "phone": phone,
                        "email": email,
                    },
                    updated_by=imported_by,
                )
                updated_count += 1
            else:
                new_student = {
                    "roll_no": roll_no,
                    "name": name,
                    "department": dept,
                    "section": section,
                    "year": year,
                    "phone": phone,
                    "email": email,
                }
                await StudentService.create_student(new_student, created_by=imported_by)
                imported_count += 1

        await audit_repo.log_action(
            user=imported_by,
            action="import",
            entity_type="student",
            entity_id=filename,
            description=f"Imported students from {filename}: {imported_count} created, {updated_count} updated, {skipped_count} skipped.",
        )

        return {
            "total_rows": total_rows,
            "imported_count": imported_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "errors": errors,
        }

    @staticmethod
    async def delete_student(roll_no: str, deleted_by: str = "system") -> bool:
        """
        Delete a student profile and ensure cascading deletion across all DB collections & storage:
          1. Student record from 'students' collection
          2. Face embeddings from 'face_embeddings' collection
          3. Violation records from 'violations' collection
          4. Training image directories from filesystem storage
          5. Audit logging
        """
        import shutil
        from app.repositories.embedding_repository import embedding_repo
        from app.repositories.violation_repository import violation_repo

        roll_no_clean = roll_no.strip().upper()
        student = await student_repo.find_by_roll_no(roll_no_clean)
        if not student:
            raise StudentNotFoundError(f"Student {roll_no_clean} not found")

        dept = student.get("department", "")
        section = student.get("section", "")

        # 1. Delete student record
        await student_repo.delete_one({"roll_no": roll_no_clean})

        # 2. Delete face embeddings
        await embedding_repo.delete_by_student(roll_no_clean)

        # 3. Delete violations
        await violation_repo.delete_by_student(roll_no_clean)

        # 4. Remove image storage directory
        if dept and section:
            dir_path = settings.STORAGE_TRAINING / dept / section / roll_no_clean
            if dir_path.exists():
                shutil.rmtree(dir_path, ignore_errors=True)

        # 5. Audit log
        await audit_repo.log_action(
            user=deleted_by,
            action="delete",
            entity_type="student",
            entity_id=roll_no_clean,
            description=f"Deleted student {roll_no_clean} ({student.get('name')}) and associated face embeddings/violations.",
        )

        logger.info("Deleted student %s and all associated data.", roll_no_clean)
        return True
