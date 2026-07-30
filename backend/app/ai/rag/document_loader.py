"""
Document Parser and Text Chunker for RAG Indexing.
"""

from typing import Any, Dict, List
import uuid


class DocumentLoader:
    """Document loader and text splitter."""

    @staticmethod
    def chunk_text(
        text: str,
        doc_title: str,
        doc_type: str = "policy",
        chunk_size: int = 500,
        chunk_overlap: int = 100,
    ) -> List[Dict[str, Any]]:
        """Split document text into chunk dictionaries with metadata."""
        paragraphs = text.split("\n\n")
        chunks: List[Dict[str, Any]] = []
        current_chunk = ""

        for p in paragraphs:
            p_clean = p.strip()
            if not p_clean:
                continue

            if len(current_chunk) + len(p_clean) < chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + p_clean
            else:
                if current_chunk:
                    chunks.append({
                        "chunk_id": str(uuid.uuid4()),
                        "doc_title": doc_title,
                        "doc_type": doc_type,
                        "text": current_chunk,
                    })
                current_chunk = p_clean

        if current_chunk:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "doc_title": doc_title,
                "doc_type": doc_type,
                "text": current_chunk,
            })

        return chunks
