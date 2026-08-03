"""
Central Tool Registry.
"""

from typing import Dict, List, Optional
from app.ai.tools.base import BaseAITool
from app.ai.tools.attendance_tool import AttendanceTool
from app.ai.tools.violation_tool import ViolationTool
from app.ai.tools.analytics_tool import AnalyticsTool
from app.ai.tools.student_tool import StudentTool
from app.ai.tools.faculty_tool import FacultyTool
from app.ai.tools.report_tool import ReportTool
from app.ai.tools.export_tool import ExportTool
from app.ai.tools.notification_tool import NotificationTool
from app.ai.tools.policy_rag_tool import PolicyRAGTool
from app.ai.tools.vision_tool import VisionTool
from app.ai.tools.recommendation_tool import RecommendationTool
from app.ai.tools.disciplinary_tool import DisciplinaryTool
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)


class ToolRegistry:
    """Registry managing enterprise AI tools."""

    _tools: Dict[str, BaseAITool] = {}

    @classmethod
    def register_default_tools(cls):
        """Register full suite of enterprise tools."""
        cls._tools.clear()
        defaults = [
            AttendanceTool(),
            ViolationTool(),
            AnalyticsTool(),
            StudentTool(),
            FacultyTool(),
            ReportTool(),
            ExportTool(),
            NotificationTool(),
            PolicyRAGTool(),
            VisionTool(),
            RecommendationTool(),
            DisciplinaryTool(),
        ]
        for t in defaults:
            cls._tools[t.name] = t
        logger.info("Registered %d enterprise AI tools in ToolRegistry", len(cls._tools))

    @classmethod
    def get_tool(cls, tool_name: str) -> Optional[BaseAITool]:
        if not cls._tools:
            cls.register_default_tools()
        return cls._tools.get(tool_name)

    @classmethod
    def list_tools(cls) -> List[Dict[str, str]]:
        if not cls._tools:
            cls.register_default_tools()
        return [{"name": t.name, "description": t.description} for t in cls._tools.values()]
