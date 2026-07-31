"""Reports API endpoints."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_permission
from app.core.security import TokenPayload
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/")
async def get_reports(
    group_by: str = Query("type", description="Group by: type, location, department"),
    user: TokenPayload = Depends(require_permission("reports.view")),
):
    reports = await AnalyticsService.get_report_data(group_by)
    return reports
