"""
Unified RAG Service Engine.
"""

from typing import Any, Dict, List, Optional

from app.ai.rag.embeddings import EmbeddingEngine
from app.ai.rag.faiss_store import FAISSStoreManager
from app.ai.rag.document_loader import DocumentLoader
from app.ai.prompts.rag_prompts import RAG_ANSWER_PROMPT
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class RAGService:
    """Institutional Policy & Handbook FAISS RAG Service."""

    _faiss_manager: Optional[FAISSStoreManager] = None

    @classmethod
    def get_store(cls) -> FAISSStoreManager:
        if cls._faiss_manager is None:
            cls._faiss_manager = FAISSStoreManager()
            # Seed default institutional attendance policy if empty
            if not cls._faiss_manager.metadata:
                cls._seed_default_policies()
        return cls._faiss_manager

    @classmethod
    def _seed_default_policies(cls):
        """Seed default institutional rules and attendance guidelines."""
        default_policy = (
            "ATTENDGUARD INSTITUTIONAL ATTENDANCE POLICY & RULE BOOK\n\n"
            "Section 1: Minimum Attendance Criteria\n"
            "1.1 All registered undergraduate and postgraduate students must maintain a minimum of 75% overall attendance in each academic semester.\n"
            "1.2 Students with attendance between 65% and 74% due to medical emergencies or official university representation may submit condonation applications subject to Dean approval.\n"
            "1.3 Attendance below 65% results in automatic detention and prohibition from appearing in end-semester examinations.\n\n"
            "Section 2: Attendance Violations & Bunks\n"
            "2.1 Any student absent from scheduled lectures without prior approved leave is logged as an Unauthorized Absence (Bunk).\n"
            "2.2 Accumulating 3 or more unapproved bunks triggers an automated alert to the Department Head and Faculty Advisor.\n"
            "2.3 Accumulating 5 or more bunks results in formal disciplinary warning and parent notification.\n\n"
            "Section 3: Disciplinary Regulations & Security Monitoring\n"
            "3.1 AttendGuard automated surveillance monitors campus entry gates, academic blocks, and laboratory zones.\n"
            "3.2 Unauthorized movement during class hours is logged as a spatial attendance violation.\n"
            "3.3 Appeals regarding erroneous violation flags must be submitted to the Campus Security Committee within 48 hours."
        )
        cls.index_document(text=default_policy, doc_title="AttendGuard_Institutional_Policy_v1.pdf", doc_type="policy")

    @classmethod
    def index_document(cls, text: str, doc_title: str, doc_type: str = "policy") -> Dict[str, Any]:
        """Chunk text, generate embeddings, and store in FAISS index."""
        store = cls.get_store()
        chunks = DocumentLoader.chunk_text(text=text, doc_title=doc_title, doc_type=doc_type)
        if not chunks:
            return {"success": False, "message": "No valid text chunks generated"}

        chunk_texts = [c["text"] for c in chunks]
        embeddings = EmbeddingEngine.embed_texts(chunk_texts)
        store.add_vectors(embeddings, chunks)

        logger.info("Indexed %d chunks for document '%s'", len(chunks), doc_title)
        return {
            "success": True,
            "doc_title": doc_title,
            "chunks_indexed": len(chunks),
            "total_store_chunks": len(store.metadata),
        }

    @classmethod
    def retrieve(cls, query: str, top_k: int = 3, min_score: float = 0.1) -> List[Dict[str, Any]]:
        """Retrieve relevant context chunks for a user query."""
        store = cls.get_store()
        query_vec = EmbeddingEngine.embed_query(query)
        results = store.search(query_vec, top_k=top_k)
        filtered = [r for r in results if r.get("score", 0.0) >= min_score]
        return filtered

    @classmethod
    async def answer_policy_question(cls, query: str) -> Dict[str, Any]:
        """Retrieve chunks and generate grounded policy answer using active LLM provider."""
        chunks = cls.retrieve(query, top_k=3)
        if not chunks:
            return {
                "success": False,
                "answer": "No relevant institutional policies or circulars were found in the indexed vector store.",
                "retrieved_chunks": [],
            }

        context_text = "\n\n".join([
            f"[{c.get('doc_title')}] (Score: {c.get('score', 0):.2f})\n{c.get('text')}"
            for c in chunks
        ])

        prompt = RAG_ANSWER_PROMPT.format(context=context_text, query=query)
        provider = LLMProviderFactory.get_provider()

        try:
            answer = await provider.generate(prompt=prompt)
            return {
                "success": True,
                "answer": answer,
                "retrieved_chunks": chunks,
                "provider": provider.model_name,
            }
        except Exception as e:
            logger.error("RAG policy answer generation failed: %s", str(e))
            return {
                "success": True,
                "answer": f"Retrieved Policy Information:\n\n{context_text}",
                "retrieved_chunks": chunks,
                "fallback": True,
            }
