"""
Persistent FAISS Vector Store Manager.
"""

import json
import os
from typing import Any, Dict, List, Tuple
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    logger.warning("FAISS module not found, using CosineSimilarityVectorStore fallback")


class CosineSimilarityVectorStore:
    """Fallback vector store when faiss binary is loading or unavailable."""

    def __init__(self, dim: int = 384):
        self.dim = dim
        self.vectors: List[np.ndarray] = []

    def add(self, vecs: np.ndarray):
        for v in vecs:
            self.vectors.append(v.copy())

    def search(self, query_vec: np.ndarray, top_k: int) -> Tuple[np.ndarray, np.ndarray]:
        if not self.vectors:
            return np.array([[]]), np.array([[]])
        matrix = np.array(self.vectors)  # (N, D)
        # Cosine similarity (vectors are unit normalized)
        scores = np.dot(matrix, query_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]
        top_scores = scores[top_indices]
        return np.array([top_scores]), np.array([top_indices])


class FAISSStoreManager:
    """FAISS Index & Metadata Store manager."""

    def __init__(self, store_dir: str = "storage/vector_store", dimension: int = 384):
        self.store_dir = store_dir
        self.dimension = dimension
        self.index_path = os.path.join(store_dir, "faiss_index.bin")
        self.metadata_path = os.path.join(store_dir, "metadata.json")
        self.metadata: List[Dict[str, Any]] = []

        os.makedirs(store_dir, exist_ok=True)
        self._init_store()

    def _init_store(self):
        if HAS_FAISS:
            if os.path.exists(self.index_path):
                try:
                    self.index = faiss.read_index(self.index_path)
                except Exception as e:
                    logger.warning("Failed to load FAISS index (%s), creating fresh index", str(e))
                    self.index = faiss.IndexFlatIP(self.dimension)
            else:
                self.index = faiss.IndexFlatIP(self.dimension)
        else:
            self.index = CosineSimilarityVectorStore(dim=self.dimension)

        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                logger.warning("Failed to load FAISS metadata: %s", str(e))
                self.metadata = []

    def save(self):
        """Persist index and metadata to disk."""
        if HAS_FAISS and hasattr(self, "index") and isinstance(self.index, faiss.Index):
            try:
                faiss.write_index(self.index, self.index_path)
            except Exception as e:
                logger.error("Failed to persist FAISS index: %s", str(e))

        try:
            with open(self.metadata_path, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            logger.error("Failed to persist metadata: %s", str(e))

    def add_vectors(self, vectors: np.ndarray, doc_chunks: List[Dict[str, Any]]):
        """Add embedding vectors and chunk metadata to the store."""
        if len(vectors) == 0:
            return

        if HAS_FAISS and hasattr(self, "index") and isinstance(self.index, faiss.Index):
            self.index.add(vectors)
        else:
            self.index.add(vectors)

        self.metadata.extend(doc_chunks)
        self.save()

    def search(self, query_vector: np.ndarray, top_k: int = 4) -> List[Dict[str, Any]]:
        """Search top_k nearest chunks for a query vector."""
        if not self.metadata:
            return []

        q_vec = np.expand_dims(query_vector, axis=0)

        if HAS_FAISS and hasattr(self, "index") and isinstance(self.index, faiss.Index):
            scores, indices = self.index.search(q_vec, min(top_k, len(self.metadata)))
            top_scores = scores[0]
            top_indices = indices[0]
        else:
            scores, indices = self.index.search(query_vector, top_k)
            top_scores = scores[0]
            top_indices = indices[0]

        results = []
        for score, idx in zip(top_scores, top_indices):
            if idx >= 0 and idx < len(self.metadata):
                chunk_data = dict(self.metadata[idx])
                chunk_data["score"] = float(score)
                results.append(chunk_data)

        return results
