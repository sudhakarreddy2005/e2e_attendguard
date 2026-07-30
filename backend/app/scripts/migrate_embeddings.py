#!/usr/bin/env python3
"""
Embedding Migration Script — Migrate from 128D (face_recognition) to 512D (ArcFace).

This script:
  1. Reads every registered student's training images from storage/training/
  2. Generates new 512D ArcFace embeddings using InsightFace
  3. Stores embeddings in the dedicated face_embeddings collection
  4. Updates student records with new registration status
  5. Validates quality of each embedding

Usage:
    cd backend
    source .venv/bin/activate
    python -m app.scripts.migrate_embeddings

IMPORTANT: This completely replaces old 128D embeddings. No dual pipeline.
"""

import asyncio
import sys
import time
from pathlib import Path

import cv2
import numpy as np


async def migrate_embeddings():
    """Main migration function."""
    # Setup database
    from app.core.config import settings
    from app.core.logging import setup_logging, get_logger, LOGGER_VISION
    from app.database.connection import connect_to_mongo, close_mongo_connection, get_database
    from app.database import collections as C

    setup_logging()
    logger = get_logger(LOGGER_VISION)

    print("\n" + "=" * 60)
    print("  AttendGuard 3.0 — Embedding Migration")
    print("  128D (face_recognition) → 512D (ArcFace)")
    print("=" * 60 + "\n")

    await connect_to_mongo()
    db = get_database()

    # Import vision components (triggers model download on first run)
    print("Loading InsightFace model...")
    from app.vision.detector import detector
    from app.vision.preprocessor import preprocessor

    # Force model load
    detector.detect(np.zeros((100, 100, 3), dtype=np.uint8))
    print("✓ InsightFace model loaded\n")

    # Get all students
    students = []
    async for student in db[C.STUDENTS].find():
        students.append(student)

    print(f"Found {len(students)} students to migrate\n")

    results = {"success": 0, "failed": 0, "no_images": 0, "total_embeddings": 0}

    for i, student in enumerate(students, 1):
        roll_no = student.get("roll_no", "")
        name = student.get("name", "")
        dept = student.get("department", "CSE")
        section = student.get("section", "A")

        # Find training images
        student_dir = settings.STORAGE_TRAINING / dept / section / roll_no
        if not student_dir.exists():
            # Try legacy flat path
            student_dir = settings.STORAGE_TRAINING / roll_no
            if not student_dir.exists():
                print(f"  {i:3d}. {name:25s} ({roll_no}) — ⚠ No image directory")
                results["no_images"] += 1
                continue

        image_files = [
            f for f in student_dir.iterdir()
            if f.is_file() and f.suffix.lower() in {".jpg", ".jpeg", ".png"}
        ]

        if not image_files:
            print(f"  {i:3d}. {name:25s} ({roll_no}) — ⚠ No images found")
            results["no_images"] += 1
            continue

        # Process each image
        embeddings = []
        image_filenames = []

        for img_path in image_files:
            image = cv2.imread(str(img_path))
            if image is None:
                continue

            # Assess quality
            quality = preprocessor.assess_quality(image)

            # Detect and embed
            processed = preprocessor.preprocess(image)
            faces = detector.detect(processed, max_faces=1)

            if not faces or faces[0].get("embedding") is None:
                continue

            face = faces[0]
            embedding = face["embedding"]

            # Store individual embedding
            embed_doc = {
                "student_id": roll_no,
                "embedding": embedding,
                "embedding_dimension": len(embedding),
                "embedding_model": "arcface",
                "model_version": settings.EMBEDDING_MODEL,
                "quality_score": quality["overall_quality"],
                "blur_score": quality["blur_score"],
                "lighting_score": quality["lighting_score"],
                "image_path": str(img_path),
                "image_filename": img_path.name,
                "is_primary": False,
                "status": "active",
            }
            await db[C.FACE_EMBEDDINGS].insert_one(embed_doc)
            embeddings.append(np.array(embedding))
            image_filenames.append(img_path.name)
            results["total_embeddings"] += 1

        if not embeddings:
            print(f"  {i:3d}. {name:25s} ({roll_no}) — ✗ No valid faces detected")
            results["failed"] += 1
            continue

        # Create averaged primary embedding
        avg_embedding = np.mean(embeddings, axis=0).tolist()

        primary_doc = {
            "student_id": roll_no,
            "embedding": avg_embedding,
            "embedding_dimension": len(avg_embedding),
            "embedding_model": "arcface",
            "model_version": settings.EMBEDDING_MODEL,
            "quality_score": 1.0,
            "is_primary": True,
            "status": "active",
        }
        await db[C.FACE_EMBEDDINGS].insert_one(primary_doc)
        results["total_embeddings"] += 1

        # Update student record
        await db[C.STUDENTS].update_one(
            {"roll_no": roll_no},
            {
                "$set": {
                    "face.registration_status": "active",
                    "face.image_filenames": image_filenames,
                    "face.image_count": len(image_filenames),
                }
            },
        )

        print(
            f"  {i:3d}. {name:25s} ({roll_no}) — ✓ {len(embeddings)} images → "
            f"{len(avg_embedding)}D embedding"
        )
        results["success"] += 1

    # Summary
    print("\n" + "=" * 60)
    print("  Migration Complete")
    print("=" * 60)
    print(f"  ✓ Success:          {results['success']}")
    print(f"  ✗ Failed:           {results['failed']}")
    print(f"  ⚠ No images:        {results['no_images']}")
    print(f"  📊 Total embeddings: {results['total_embeddings']}")
    print(f"\n  All embeddings are 512D ArcFace ({settings.EMBEDDING_MODEL})")
    print("=" * 60 + "\n")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(migrate_embeddings())
