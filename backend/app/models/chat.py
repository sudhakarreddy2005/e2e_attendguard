"""
Chat & AI Copilot domain models for MongoDB memory persistence.
"""

from typing import Any, Dict, List, Optional
from pydantic import Field

from app.models.base import DocumentBase


class ChatSessionDocument(DocumentBase):
    """Represents an ongoing multi-turn AI copilot session."""
    session_id: str
    user_id: str
    user_role: str = "faculty"
    title: str = "New Conversation"
    active: bool = True
    named_entities: Dict[str, Any] = Field(default_factory=dict)
    pending_tasks: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatMessageDocument(DocumentBase):
    """Represents a single message turn in an AI chat session."""
    session_id: str
    user_id: str
    role: str  # user | assistant | system | tool
    content: str
    intent: Optional[str] = None
    tools_executed: List[str] = Field(default_factory=list)
    structured_data: Optional[Dict[str, Any]] = None
    feedback_score: Optional[int] = None  # 1 for upvote, -1 for downvote


class ConversationSummaryDocument(DocumentBase):
    """Semantic summary of a historical chat session for RAG & context compression."""
    session_id: str
    user_id: str
    summary_text: str
    key_topics: List[str] = Field(default_factory=list)
    message_count: int = 0
    embedding_indexed: bool = False
