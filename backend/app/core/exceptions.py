"""
Centralized exception hierarchy for the application.

All custom exceptions inherit from AppException.
FastAPI exception handlers in middleware/error_handler.py
convert these into structured JSON responses.
"""

from typing import Any, Optional


class AppException(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Any] = None,
    ):
        self.message = message or self.__class__.message
        self.details = details
        super().__init__(self.message)

    def to_dict(self) -> dict:
        result = {
            "success": False,
            "error": {
                "code": self.error_code,
                "message": self.message,
            },
        }
        if self.details:
            result["error"]["details"] = self.details
        return result


# ── 400 Errors ────────────────────────────────────────────────────────────

class ValidationError(AppException):
    status_code = 400
    error_code = "VALIDATION_ERROR"
    message = "Invalid input data"


class BadRequestError(AppException):
    status_code = 400
    error_code = "BAD_REQUEST"
    message = "Bad request"


# ── 401 / 403 Errors ─────────────────────────────────────────────────────

class AuthenticationError(AppException):
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"
    message = "Authentication failed"


class ForbiddenError(AppException):
    status_code = 403
    error_code = "FORBIDDEN"
    message = "You do not have permission to perform this action"


class InsufficientRoleError(ForbiddenError):
    error_code = "INSUFFICIENT_ROLE"
    message = "Your role does not have access to this resource"


# ── 404 Errors ────────────────────────────────────────────────────────────

class NotFoundError(AppException):
    status_code = 404
    error_code = "NOT_FOUND"
    message = "Resource not found"


class StudentNotFoundError(NotFoundError):
    error_code = "STUDENT_NOT_FOUND"
    message = "Student not found"


class ViolationNotFoundError(NotFoundError):
    error_code = "VIOLATION_NOT_FOUND"
    message = "Violation not found"


# ── 409 Errors ────────────────────────────────────────────────────────────

class DuplicateError(AppException):
    status_code = 409
    error_code = "DUPLICATE"
    message = "Resource already exists"


class DuplicateStudentError(DuplicateError):
    error_code = "DUPLICATE_STUDENT"
    message = "A student with this roll number already exists"


# ── 422 Errors ────────────────────────────────────────────────────────────

class FaceDetectionError(AppException):
    status_code = 422
    error_code = "FACE_DETECTION_ERROR"
    message = "Face detection failed"


class NoFaceDetectedError(FaceDetectionError):
    error_code = "NO_FACE_DETECTED"
    message = "No face detected in the uploaded image"


class MultipleFacesError(FaceDetectionError):
    error_code = "MULTIPLE_FACES"
    message = "Multiple faces detected — single face required for registration"


class ImageQualityError(FaceDetectionError):
    error_code = "IMAGE_QUALITY_ERROR"
    message = "Image quality is too low for reliable recognition"


# ── 500 Errors ────────────────────────────────────────────────────────────

class DatabaseError(AppException):
    status_code = 500
    error_code = "DATABASE_ERROR"
    message = "Database operation failed"


class AIProviderError(AppException):
    status_code = 500
    error_code = "AI_PROVIDER_ERROR"
    message = "AI service is unavailable"


class RecognitionPipelineError(AppException):
    status_code = 500
    error_code = "RECOGNITION_PIPELINE_ERROR"
    message = "Face recognition pipeline encountered an error"
