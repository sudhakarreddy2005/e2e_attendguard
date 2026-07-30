"""
Entity Extractor Module — Extracts structured entities (department, section, student_id, role, date) from user queries.
"""

import re
from typing import Any, Dict

DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIML", "AIDS", "CS"]


def extract_entities(query: str) -> Dict[str, Any]:
    """Extract structured entity metadata from raw query string."""
    q_upper = query.upper()
    entities: Dict[str, Any] = {}

    # Department extraction
    for dept in DEPARTMENTS:
        pattern = r"\b" + dept + r"\b"
        if re.search(pattern, q_upper):
            entities["department"] = dept
            break

    # Section extraction (e.g. "Section A", "Sec B", "CSE-A")
    sec_match = re.search(r"\bSECTION\s+([A-D])\b|\bSEC\s+([A-D])\b", q_upper)
    if sec_match:
        entities["section"] = sec_match.group(1) or sec_match.group(2)

    # Student ID extraction (e.g. 23BQ1A05A9)
    id_match = re.search(r"\b\d{2}[A-Z]{2}\d[A-Z]\d{2}[A-Z0-9]\d\b", q_upper)
    if id_match:
        entities["student_id"] = id_match.group(0)

    # Date / Time scope
    q_lower = query.lower()
    if "today" in q_lower:
        entities["date"] = "today"
    elif "yesterday" in q_lower:
        entities["date"] = "yesterday"
    elif "week" in q_lower:
        entities["date"] = "this_week"

    # Role scope
    if "principal" in q_lower:
        entities["role"] = "principal"
    elif "faculty" in q_lower or "teacher" in q_lower:
        entities["role"] = "faculty"
    elif "hod" in q_lower:
        entities["role"] = "hod"

    return entities
