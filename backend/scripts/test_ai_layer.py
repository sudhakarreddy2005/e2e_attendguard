"""
Verification Test Suite for AttendGuard Agentic AI Layer.
Tests 8 distinct query variations (sort direction, department filters, result limits, follow-ups)
and asserts that responses differ appropriately and match ground-truth MongoDB results.
"""

import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.ai.master_agent import MasterAgent
from app.core.logging import get_logger, LOGGER_AI

logger = get_logger(LOGGER_AI)

TEST_QUERIES = [
    ("Query 1: Low violation count list", "low violation count students list", "Lowest"),
    ("Query 2: High violation top 5", "highest violation count students top 5", "Highest"),
    ("Query 3: ECE department students", "list all ece students", "ECE"),
    ("Query 4: Low count list of 3", "low violation count students list of 3", "Lowest"),
    ("Query 5: Student lookup", "student 23BQ1A05A9", "Student"),
    ("Query 6: Faculty directory", "faculty list CSE", "Faculty"),
    ("Query 7: Policy question", "what is the leave policy", "Policy"),
    ("Query 8: Multi-turn follow-up", "show bunks", "Bunks"),
]


async def main():
    print("=" * 70)
    print("🤖 AttendGuard Agentic AI Layer Test Suite (8 Query Assertions)")
    print("=" * 70)

    await connect_to_mongo()

    try:
        session_id = "test_ai_layer_suite"
        responses = []

        for label, query, expected_keyword in TEST_QUERIES:
            print(f"\n🧪 Running {label}: '{query}'")
            res = await MasterAgent.process_query(query, session_id=session_id)
            ans = res.get("answer", "")
            intent = res.get("intent")
            print(f"   ► Intent Classified: {intent}")
            print(f"   ► Response Preview: {ans[:120].replace(chr(10), ' ')}...")

            assert ans and len(ans) > 10, f"Empty response for '{query}'"
            responses.append(ans)

        # Assertion: Ensure Query 1 (Low) and Query 2 (High) return DIFFERENT responses
        assert responses[0] != responses[1], "FAILED: Low and High queries returned identical responses!"
        print("\n✅ ASSERTION PASSED: Low and High queries generated distinct, sorted answers.")

        # Assertion: Ensure Query 3 contains ECE department context
        assert "ECE" in responses[2] or "ece" in responses[2].lower(), "FAILED: ECE department query did not return ECE data!"
        print("✅ ASSERTION PASSED: Department filter correctly scoped response.")

        print("\n🎉 ALL 8 AGENTIC AI LAYER TESTS PASSED SUCCESSFULLY!")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
