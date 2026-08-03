"""
Master AI Agent Facade & Session Memory Manager.
"""

from typing import Any, Dict, List, Optional
from app.ai.graph.workflow import AgentWorkflowRunner
from app.core.logging import get_logger, LOGGER_AI
from app.repositories.chat_repository import chat_repo

logger = get_logger(LOGGER_AI)


class MasterAgent:
    """Master AI Agent unifying LangGraph, memory, tool orchestration, and RAG."""

    @classmethod
    async def process_query(
        cls,
        query: str,
        session_id: str = "default_session",
        user_id: str = "system_user",
        user_role: str = "faculty",
    ) -> Dict[str, Any]:
        """Execute query through Master Agent and update conversational memory in MongoDB."""
        logger.info("MasterAgent processing query for session '%s' (user: %s): %s", session_id, user_id, query)

        # 1. Ensure session exists
        await chat_repo.get_or_create_session(session_id, user_id=user_id, user_role=user_role)

        # 2. Retrieve recent messages and session summary from MongoDB
        recent_msgs_docs = await chat_repo.get_recent_messages(session_id, limit=10)
        summary = await chat_repo.get_session_summary(session_id)

        history = [{"role": msg["role"], "content": msg["content"]} for msg in recent_msgs_docs]

        # 3. Formulate query using fresh input
        enriched_query = query.strip()

        # 4. Execute LangGraph workflow
        result = await AgentWorkflowRunner.run_workflow(
            query=enriched_query,
            session_id=session_id,
            messages=history,
            summary=summary,
        )


        # 5. Persist user and assistant turns to MongoDB
        await chat_repo.add_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=query,
        )
        await chat_repo.add_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=result.get("answer", ""),
            intent=result.get("intent"),
            tools_executed=[t.get("tool") for t in result.get("tool_results", []) if isinstance(t, dict)],
            structured_data=result.get("tool_results"),
        )

        return {
            "success": True,
            "session_id": session_id,
            "intent": result.get("intent"),
            "plan": result.get("plan"),
            "answer": result.get("answer"),
            "tool_results": result.get("tool_results"),
            "rag_context": result.get("rag_context"),
            "memory_turns": len(history) // 2 + 1,
        }

