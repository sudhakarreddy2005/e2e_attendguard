"""
AI Assistant API Endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import require_permission
from app.core.security import TokenPayload
from app.services.ai_service import AIService


class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default_session"


class RAGIndexRequest(BaseModel):
    text: str
    doc_title: str
    doc_type: Optional[str] = "policy"


router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/query")
async def query_ai(
    request: QueryRequest,
    user: TokenPayload = Depends(require_permission("ai.chat")),
):
    """Execute AI query through Master Agent."""
    return await AIService.query_assistant(prompt=request.query, session_id=request.session_id or "default_session")


@router.post("/chat")
async def chat_ai(
    request: QueryRequest,
    user: TokenPayload = Depends(require_permission("ai.chat")),
):
    """Multi-turn conversational chat endpoint."""
    return await AIService.query_assistant(prompt=request.query, session_id=request.session_id or "default_session")


@router.post("/rag/index")
async def index_document(
    request: RAGIndexRequest,
    user: TokenPayload = Depends(require_permission("ai.chat")),
):
    """Index institutional document text into FAISS vector store."""
    return await AIService.index_rag_document(
        text=request.text,
        doc_title=request.doc_title,
        doc_type=request.doc_type or "policy",
    )


@router.post("/rag/search")
async def search_rag_store(
    query: str,
    user: TokenPayload = Depends(require_permission("ai.chat")),
):
    """Search institutional policy FAISS vector store."""
    return await AIService.search_rag(query=query)
