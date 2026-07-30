"""
Master AI Agent Facade & Session Memory Manager.
"""

from typing import Any, Dict, List, Optional
from app.ai.graph.workflow import AgentWorkflowRunner
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class MasterAgent:
    """Master AI Agent unifying LangGraph, memory, tool orchestration, and RAG."""

    # In-memory multi-turn session store (session_id -> List[Dict[str, str]])
    _session_memory: Dict[str, List[Dict[str, str]]] = {}

    @classmethod
    def get_session_history(cls, session_id: str) -> List[Dict[str, str]]:
        return cls._session_memory.get(session_id, [])

    @classmethod
    def add_session_message(cls, session_id: str, role: str, content: str):
        if session_id not in cls._session_memory:
            cls._session_memory[session_id] = []
        cls._session_memory[session_id].append({"role": role, "content": content})
        # Keep last 20 messages per session
        if len(cls._session_memory[session_id]) > 20:
            cls._session_memory[session_id] = cls._session_memory[session_id][-20:]

    @classmethod
    async def process_query(
        cls,
        query: str,
        session_id: str = "default_session",
    ) -> Dict[str, Any]:
        """Execute query through Master Agent and update conversational memory."""
        logger.info("MasterAgent processing query for session '%s': %s", session_id, query)

        # 1. Retrieve conversational memory context
        history = cls.get_session_history(session_id)

        # 2. Check for contextual follow-up modifier (e.g. "Only CSE", "Generate a PDF")
        enriched_query = query
        if history and len(query.split()) <= 4:
            last_user_msg = [m for m in history if m["role"] == "user"]
            if last_user_msg:
                enriched_query = f"{last_user_msg[-1]['content']} [Filter/Follow-up refinement: {query}]"

        # 3. Execute LangGraph workflow
        result = await AgentWorkflowRunner.run_workflow(
            query=enriched_query,
            session_id=session_id,
            messages=history,
        )

        # 4. Save turn to memory
        cls.add_session_message(session_id, "user", query)
        cls.add_session_message(session_id, "assistant", result.get("answer", ""))

        return {
            "success": True,
            "session_id": session_id,
            "intent": result.get("intent"),
            "plan": result.get("plan"),
            "answer": result.get("answer"),
            "tool_results": result.get("tool_results"),
            "rag_context": result.get("rag_context"),
            "memory_turns": len(cls.get_session_history(session_id)) // 2,
        }
