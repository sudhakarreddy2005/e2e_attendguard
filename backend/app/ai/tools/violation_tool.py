"""
Violation Tool — Retrieve incident logs, location hotspots, repeat offenders, and peak violation timings.
"""

from typing import Any, Dict, Optional
from app.ai.tools.base import BaseAITool
from app.repositories.violation_repository import violation_repo


class ViolationTool(BaseAITool):
    name = "ViolationTool"
    description = "Retrieve and analyze violation logs, incident hotspots, repeat offenders, and peak timings."

    async def run(
        self,
        department: Optional[str] = None,
        location: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
        **kwargs,
    ) -> Dict[str, Any]:
        """Execute violation analysis tool."""
        query = {}
        if department:
            query["department"] = department.upper()
        if location:
            query["location"] = location
        if status:
            query["status"] = status

        violations = await violation_repo.find_many(query, limit=limit)
        total_violations = await violation_repo.count(query)

        # Location hotspots aggregation
        loc_pipeline = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        hotspots_raw = await violation_repo.aggregate(loc_pipeline)
        hotspots = [{"location": h["_id"] or "Unknown", "count": h["count"]} for h in hotspots_raw]

        # Top rule violation types
        type_pipeline = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        types_raw = await violation_repo.aggregate(type_pipeline)
        top_types = [{"type": t["_id"] or "Bunk", "count": t["count"]} for t in types_raw]

        return {
            "success": True,
            "total_violations": total_violations,
            "hotspots": hotspots,
            "top_violation_types": top_types,
            "recent_incidents": [
                {
                    "id": str(v.get("_id", "")),
                    "student_id": v.get("student_id"),
                    "name": v.get("student_name"),
                    "location": v.get("location"),
                    "type": v.get("type", "Bunk"),
                    "confidence": v.get("confidence", 0.0),
                    "status": v.get("status", "pending"),
                    "timestamp": str(v.get("timestamp", "")),
                }
                for v in violations
            ],
        }
