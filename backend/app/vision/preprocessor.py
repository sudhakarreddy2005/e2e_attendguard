"""
Image preprocessor — blur detection, contrast normalization, upscaling.

Prepares raw images for the face detection pipeline by assessing
quality and applying corrections when possible.
"""

import cv2
import numpy as np

from app.core.logging import get_logger, LOGGER_VISION

logger = get_logger(LOGGER_VISION)


class ImagePreprocessor:
    """Handles image quality assessment and enhancement."""

    BLUR_THRESHOLD_SEVERE = 3.0
    BLUR_THRESHOLD_MILD = 45.0
    MIN_IMAGE_SIZE = 60  # Minimum dimension in pixels

    @staticmethod
    def calculate_blur_score(image: np.ndarray) -> float:
        """Calculate Laplacian variance as a blur metric. Higher = sharper."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    @staticmethod
    def calculate_lighting_score(image: np.ndarray) -> float:
        """Estimate lighting quality. Returns 0-1 score."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        # Ideal range: mean ~120-140, std > 40
        mean_score = 1.0 - abs(mean_val - 130) / 130
        std_score = min(std_val / 60, 1.0)
        return float(np.clip((mean_score + std_score) / 2, 0, 1))

    @staticmethod
    def normalize_contrast(image: np.ndarray) -> np.ndarray:
        """Apply CLAHE contrast normalization to improve feature extraction."""
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l_enhanced = clahe.apply(l_channel)
            merged = cv2.merge((l_enhanced, a, b))
            return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
        else:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            return clahe.apply(image)

    @staticmethod
    def upscale_if_small(image: np.ndarray, min_dim: int = 640) -> np.ndarray:
        """Upscale small images using high-quality interpolation."""
        h, w = image.shape[:2]
        if max(h, w) < min_dim:
            scale = min_dim / max(h, w)
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
            logger.debug("Upscaled image from %dx%d to %dx%d", w, h, new_w, new_h)
        return image

    def assess_quality(self, image: np.ndarray) -> dict:
        """Comprehensive quality assessment of an image."""
        blur = self.calculate_blur_score(image)
        lighting = self.calculate_lighting_score(image)
        h, w = image.shape[:2]

        is_severely_blurry = blur < self.BLUR_THRESHOLD_SEVERE
        is_mildly_blurry = blur < self.BLUR_THRESHOLD_MILD
        is_too_small = min(h, w) < self.MIN_IMAGE_SIZE

        overall_score = 1.0
        if is_severely_blurry:
            overall_score = 0.2
        elif is_mildly_blurry:
            overall_score *= 0.7
        if is_too_small:
            overall_score *= 0.6
        overall_score *= max(lighting, 0.5)

        return {
            "blur_score": round(blur, 2),
            "lighting_score": round(lighting, 3),
            "overall_quality": round(overall_score, 3),
            "width": w,
            "height": h,
            "is_acceptable": overall_score > 0.05,
            "issues": [
                *(["severely_blurry"] if is_severely_blurry else []),
                *(["mildly_blurry"] if is_mildly_blurry and not is_severely_blurry else []),
                *(["too_small"] if is_too_small else []),
                *(["poor_lighting"] if lighting < 0.3 else []),
            ],
        }

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """Apply all preprocessing steps to improve recognition."""
        # Upscale small images
        image = self.upscale_if_small(image)

        # Normalize contrast if mildly blurry or poor lighting
        blur = self.calculate_blur_score(image)
        if blur < self.BLUR_THRESHOLD_MILD:
            image = self.normalize_contrast(image)

        return image


# Singleton
preprocessor = ImagePreprocessor()
