"""
AI Service — Provides natural language Q&A, multi-turn reasoning, and automated report generation via MasterAgent.
"""

from typing import Any, Dict, Optional
from app.ai.master_agent import MasterAgent
from app.ai.rag.rag_service import RAGService
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class AIService:

    @staticmethod
    async def query_assistant(prompt: str, session_id: str = "default_session") -> Dict[str, Any]:
        """Query Master Agent with conversational state and tool execution."""
        try:
            return await MasterAgent.process_query(query=prompt, session_id=session_id)
        except Exception as e:
            logger.error("MasterAgent query processing failed: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "answer": f"System error processing query: {str(e)}",
            }

    @staticmethod
    async def index_rag_document(text: str, doc_title: str, doc_type: str = "policy") -> Dict[str, Any]:
        """Index institutional document into FAISS RAG vector store."""
        return RAGService.index_document(text=text, doc_title=doc_title, doc_type=doc_type)

    @staticmethod
    async def search_rag(query: str, top_k: int = 3) -> Dict[str, Any]:
        """Search FAISS RAG store."""
        return await RAGService.answer_policy_question(query=query)
