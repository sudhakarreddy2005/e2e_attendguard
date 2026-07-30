"""
Face alignment using detected landmarks.

Applies affine transformation to normalize face pose
for more reliable embedding extraction.
"""

import cv2
import numpy as np

from app.core.logging import get_logger, LOGGER_VISION

logger = get_logger(LOGGER_VISION)

# Standard reference landmarks for a 112x112 aligned face
REFERENCE_LANDMARKS = np.array([
    [38.2946, 51.6963],   # Left eye
    [73.5318, 51.5014],   # Right eye
    [56.0252, 71.7366],   # Nose tip
    [41.5493, 92.3655],   # Left mouth corner
    [70.7299, 92.2041],   # Right mouth corner
], dtype=np.float32)


class FaceAligner:
    """Align detected faces using 5-point landmarks to a canonical 112x112 image."""

    def __init__(self, output_size: int = 112):
        self.output_size = output_size

    def align(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        """
        Align a face using detected landmarks.

        Args:
            image: Full image (BGR)
            landmarks: 5x2 array of facial landmark coordinates

        Returns:
            Aligned 112x112 face image
        """
        if landmarks is None or len(landmarks) < 5:
            logger.warning("Insufficient landmarks for alignment — skipping")
            return image

        landmarks = np.array(landmarks, dtype=np.float32)

        # Compute similarity transform
        transform = cv2.estimateAffinePartial2D(
            landmarks, REFERENCE_LANDMARKS,
            method=cv2.RANSAC,
        )[0]

        if transform is None:
            logger.warning("Failed to compute alignment transform")
            return image

        aligned = cv2.warpAffine(
            image, transform,
            (self.output_size, self.output_size),
            borderValue=0.0,
        )

        return aligned

    def estimate_pose_angle(self, landmarks: np.ndarray) -> str:
        """Estimate face pose from landmarks (rough categorization)."""
        if landmarks is None or len(landmarks) < 5:
            return "unknown"

        landmarks = np.array(landmarks)
        left_eye = landmarks[0]
        right_eye = landmarks[1]
        nose = landmarks[2]

        # Horizontal ratio of nose position between eyes
        eye_center_x = (left_eye[0] + right_eye[0]) / 2
        nose_offset = (nose[0] - eye_center_x) / max(abs(right_eye[0] - left_eye[0]), 1)

        if abs(nose_offset) < 0.1:
            return "frontal"
        elif nose_offset < -0.1:
            return "left"
        else:
            return "right"


# Singleton
aligner = FaceAligner()
