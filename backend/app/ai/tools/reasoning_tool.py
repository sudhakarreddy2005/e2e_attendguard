"""
Reasoning Engine Tool — Decompose multi-step complex user requests.
"""

from typing import Any, Dict, List
from app.ai.tools.base import BaseAITool


class ReasoningTool(BaseAITool):
    name = "ReasoningTool"
    description = "Decompose complex multi-step queries into an ordered sequence of executable sub-tasks."

    async def run(self, query: str, **kwargs) -> Dict[str, Any]:
        """Decompose query into structured execution plan."""
        steps: List[str] = []

        query_lower = query.lower()
        if "policy" in query_lower or "rule" in query_lower or "leave" in query_lower:
            steps.append("Search institutional policy document index via RAGTool.")
        if "student" in query_lower or "bunk" in query_lower or "attendance" in query_lower:
            steps.append("Query GuardDB student database via AttendanceTool.")
        if "violation" in query_lower or "spot" in query_lower or "incident" in query_lower:
            steps.append("Fetch incident logs and hotspot rankings via ViolationTool.")
        if "report" in query_lower or "summary" in query_lower:
            steps.append("Synthesize results into structured markdown via ReportTool.")

        if not steps:
            steps.append("Gather statistics from AttendanceTool and ViolationTool.")
            steps.append("Synthesize final answer with grounding verification.")

        return {
            "success": True,
            "query": query,
            "decomposed_steps": steps,
        }
