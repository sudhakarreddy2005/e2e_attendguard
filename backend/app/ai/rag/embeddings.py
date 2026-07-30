"""
Embeddings Generator with fallback support.
"""

import hashlib
from typing import List
import numpy as np

from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)

_model_cache = None


class EmbeddingEngine:
    """Generates normalized dense vector embeddings."""

    @classmethod
    def _get_st_model(cls):
        global _model_cache
        if _model_cache is None:
            try:
                from sentence_transformers import SentenceTransformer
                _model_cache = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model 'all-MiniLM-L6-v2' loaded successfully")
            except Exception as e:
                logger.warning("SentenceTransformer failed to load (%s), using lightweight hash embedding fallback", str(e))
                _model_cache = "hash_fallback"
        return _model_cache

    @classmethod
    def embed_texts(cls, texts: List[str]) -> np.ndarray:
        """Embed a list of text strings into (N, D) float32 numpy array."""
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        model = cls._get_st_model()
        if model != "hash_fallback":
            try:
                embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.astype(np.float32)
            except Exception as e:
                logger.warning("Error during sentence transformer encoding: %s", str(e))

        # Fallback deterministic pseudo-embedding (384-dimensional)
        vectors = []
        for text in texts:
            vec = np.zeros(384, dtype=np.float32)
            words = text.lower().split()
            for idx, word in enumerate(words):
                h = hashlib.sha256(word.encode("utf-8")).digest()
                for i in range(16):
                    sub_idx = (h[i] + idx) % 384
                    vec[sub_idx] += (h[i] / 255.0) - 0.5
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            vectors.append(vec)
        return np.array(vectors, dtype=np.float32)

    @classmethod
    def embed_query(cls, query: str) -> np.ndarray:
        """Embed a single search query."""
        res = cls.embed_texts([query])
        return res[0]
