"""
AgentState definition for LangGraph.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """LangGraph State Object tracking multi-turn agent execution flow."""

    query: str
    session_id: str
    messages: List[Dict[str, str]]
    intent: Optional[str]
    secondary_intents: List[str]
    plan: List[str]
    current_step_index: int
    required_tools: List[str]
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    rag_context: List[Dict[str, Any]]
    reasoning_synthesis: Optional[str]
    is_complete: bool
    validation_status: Optional[Dict[str, Any]]
    final_response: Optional[str]
