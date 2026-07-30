"""
Cosine similarity engine for face embedding matching.

Compares 512-D ArcFace embeddings using cosine similarity.
Supports multi-pass matching with configurable thresholds.
"""

import numpy as np

from app.core.config import settings
from app.core.logging import get_logger, LOGGER_VISION

logger = get_logger(LOGGER_VISION)


class SimilarityEngine:
    """Compare face embeddings using cosine similarity."""

    def __init__(self, threshold: float = None):
        self.threshold = threshold or settings.FACE_SIMILARITY_THRESHOLD

    @staticmethod
    def cosine_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings. Returns 0-1."""
        a = np.array(embedding_a, dtype=np.float32)
        b = np.array(embedding_b, dtype=np.float32)

        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return float(np.dot(a, b) / (norm_a * norm_b))

    def find_best_match(
        self,
        query_embedding: list[float],
        candidates: list[dict],
        embedding_key: str = "embedding",
    ) -> tuple[dict | None, float]:
        """
        Find the best matching candidate by cosine similarity.
        Implements a Multi-Pass Adaptive Match strategy:
          - Pass 1: Primary threshold check (>= threshold, default 0.45)
          - Pass 2: Adaptive margin check (>= 0.36 if top candidate has >= 0.08 margin over 2nd best)
        """
        if not candidates:
            return None, 0.0

        query = np.array(query_embedding, dtype=np.float32)
        matches = []

        for candidate in candidates:
            stored_embedding = candidate.get(embedding_key)
            if not stored_embedding:
                continue

            similarity = self.cosine_similarity(query, np.array(stored_embedding))
            matches.append((candidate, similarity))

        if not matches:
            return None, 0.0

        # Sort by similarity descending
        matches.sort(key=lambda x: x[1], reverse=True)

        best_match, best_sim = matches[0]

        # Primary Pass: Exceeds standard threshold
        if best_sim >= self.threshold:
            return best_match, best_sim

        # Secondary Pass: Adaptive match with clear separation margin
        second_sim = matches[1][1] if len(matches) > 1 else 0.0
        margin = best_sim - second_sim

        if best_sim >= 0.36 and (margin >= 0.07 or len(matches) == 1):
            logger.info(
                "Adaptive secondary pass match: student=%s (%s), similarity=%.4f (margin=%.4f)",
                best_match.get("student_name"), best_match.get("student_id"), best_sim, margin,
            )
            return best_match, best_sim

        return None, best_sim

    def find_all_matches(
        self,
        query_embedding: list[float],
        candidates: list[dict],
        embedding_key: str = "embedding",
        top_k: int = 5,
    ) -> list[dict]:
        """Find top-K matches sorted by similarity (descending)."""
        query = np.array(query_embedding, dtype=np.float32)
        results = []

        for candidate in candidates:
            stored_embedding = candidate.get(embedding_key)
            if not stored_embedding:
                continue

            similarity = self.cosine_similarity(query, np.array(stored_embedding))
            results.append({
                **candidate,
                "similarity": round(similarity, 4),
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def is_match(self, similarity: float) -> bool:
        """Check if a similarity score exceeds the threshold."""
        return similarity >= self.threshold


# Singleton
similarity_engine = SimilarityEngine()
