"""
Policy RAG Tool — Search FAISS vector store strictly for policy rules, handbooks, and leave circulars.
"""

from typing import Any, Dict
from app.ai.tools.base import BaseAITool
from app.ai.rag.rag_service import RAGService


class PolicyRAGTool(BaseAITool):
    name = "PolicyRAGTool"
    description = "Search institutional attendance policy, college handbook, leave rules, and circulars via FAISS vector store."

    async def run(self, query: str, top_k: int = 3, **kwargs) -> Dict[str, Any]:
        """Execute policy RAG search returning structured JSON ONLY."""
        res = await RAGService.answer_policy_question(query)
        return res
