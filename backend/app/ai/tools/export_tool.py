"""
Export Tool — Prepares parameters and links for CSV/PDF export.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool


class ExportTool(BaseAITool):
    name = "ExportTool"
    description = "Prepare data payload and parameters for exporting reports, violation logs, and attendance tables."

    async def run(
        self,
        export_format: str = "pdf",
        data_type: str = "violations",
        department: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Prepare export metadata returning structured JSON ONLY."""
        filename = f"AttendGuard_{data_type.title()}_{department or 'AllDepts'}.{export_format.lower()}"
        return {
            "success": True,
            "export_format": export_format.upper(),
            "data_type": data_type,
            "filename": filename,
            "download_url": f"/api/reports/download/{filename}",
            "status": "READY_FOR_EXPORT",
        }
