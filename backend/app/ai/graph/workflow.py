"""
LangGraph State Graph Builder and Runner for 10-Stage Enterprise Agentic Pipeline.
User -> Intent Classifier -> Planner -> Memory -> Entity Extractor -> Tool Router -> Tool Execution -> Response Synthesizer -> Response Validator -> Natural Language Formatter -> Chat UI
"""

from typing import Any, Dict, Optional
from app.ai.graph.state import AgentState
from app.ai.graph.nodes import (
    intent_classifier_node,
    planner_node,
    memory_node,
    entity_extractor_node,
    tool_router_node,
    tool_exec_node,
    response_synthesizer_node,
    response_validator_node,
    natural_language_formatter_node,
)
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class AgentWorkflowRunner:
    """Orchestrates 10-stage agentic workflow execution."""

    @classmethod
    async def run_workflow(
        self,
        query: str,
        session_id: str = "default_session",
        messages: Optional[list] = None,
        summary: Optional[str] = None,
    ) -> Dict[str, Any]:

        """Execute full 10-stage pipeline sequence."""
        state: AgentState = {
            "query": query,
            "session_id": session_id,
            "messages": messages or [],
            "intent": None,
            "secondary_intents": [],
            "plan": [],
            "current_step_index": 0,
            "required_tools": [],
            "tool_calls": [],
            "tool_results": [],
            "rag_context": [],
            "reasoning_synthesis": None,
            "is_complete": False,
            "validation_status": None,
            "final_response": None,
        }

        # Stage 1: Intent Classifier
        s1 = await intent_classifier_node(state)
        state.update(s1)

        # Stage 2: Planner
        s2 = await planner_node(state)
        state.update(s2)

        # Stage 3: Conversation Memory
        s3 = await memory_node(state)
        state.update(s3)

        # Stage 4: Entity Extractor
        s4 = await entity_extractor_node(state)
        state.update(s4)

        # Stage 5 & 6: Tool Router and Execution (if not greeting)
        if state.get("intent") not in ("greeting", "small_talk"):
            for _ in range(2):
                s5 = await tool_router_node(state)
                state.update(s5)
                if not state.get("tool_calls"):
                    break
                s6 = await tool_exec_node(state)
                state.update(s6)

        # Stage 7: Response Synthesizer
        s7 = await response_synthesizer_node(state)
        state.update(s7)

        # Stage 8: Response Validator
        s8 = await response_validator_node(state)
        state.update(s8)

        # Stage 9: Natural Language Formatter
        s9 = await natural_language_formatter_node(state)
        state.update(s9)

        # Stage 10: Output delivered to Chat UI
        return {
            "success": True,
            "intent": state.get("intent"),
            "plan": state.get("plan"),
            "tool_results": state.get("tool_results"),
            "rag_context": state.get("rag_context"),
            "answer": state.get("final_response"),
            "validation": state.get("validation_status"),
        }
