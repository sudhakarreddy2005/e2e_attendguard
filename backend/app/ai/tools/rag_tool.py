"""
RAG Tool — Search FAISS vector store for institutional rules, circulars, and handbooks.
"""

from typing import Any, Dict
from app.ai.tools.base import BaseAITool
from app.ai.rag.rag_service import RAGService


class RAGTool(BaseAITool):
    name = "RAGTool"
    description = "Search institutional attendance policy, college handbook, rulebooks, circulars, and timetables via FAISS vector store."

    async def run(self, query: str, top_k: int = 3, **kwargs) -> Dict[str, Any]:
        """Execute RAG search."""
        res = await RAGService.answer_policy_question(query)
        return res
