"""Dashboard / Analytics API endpoints."""

from fastapi import APIRouter, Depends

from app.api.deps import require_permission
from app.core.security import TokenPayload
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/kpis")
async def get_dashboard_kpis(
    user: TokenPayload = Depends(require_permission("dashboard.view")),
):
    data = await AnalyticsService.get_dashboard_kpis()
    return {"success": True, "data": data}
