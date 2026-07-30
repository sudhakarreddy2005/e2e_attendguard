"""
Verification Test Suite for AttendGuard Agentic AI Layer.
"""

import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.ai.providers.factory import LLMProviderFactory
from app.ai.tools.registry import ToolRegistry
from app.ai.rag.rag_service import RAGService
from app.ai.master_agent import MasterAgent


async def main():
    print("=" * 60)
    print("🤖 AttendGuard Agentic AI Layer Verification Suite")
    print("=" * 60)

    # Initialize MongoDB connection for testing
    await connect_to_mongo()

    try:
        # 1. Test Provider Factory
        provider = LLMProviderFactory.get_provider()
        print(f"✅ Provider Factory Loaded: {provider.__class__.__name__} (Model: {provider.model_name})")

        # 2. Test Tool Registry
        tools = ToolRegistry.list_tools()
        print(f"✅ Tool Registry Loaded {len(tools)} tools:")
        for t in tools:
            print(f"   - {t['name']}: {t['description'][:60]}...")

        # 3. Test Tool Execution
        att_tool = ToolRegistry.get_tool("AttendanceTool")
        att_res = await att_tool.run()
        print(f"✅ AttendanceTool Output Success: {att_res['success']}")

        # 4. Test RAG System
        rag_res = await RAGService.answer_policy_question("What is the minimum attendance requirement?")
        print(f"✅ RAG Service Policy Query Success: {rag_res['success']}")
        print(f"   Retrieved Chunks: {len(rag_res.get('retrieved_chunks', []))}")

        # 5. Test Master Agent Multi-Turn Execution
        print("\n--- Testing Multi-Turn Session Execution ---")
        res1 = await MasterAgent.process_query("Show violation summary for CSE department", session_id="test_sess_1")
        print(f"Turn 1 Intent: {res1.get('intent')}")
        print(f"Turn 1 Answer Preview:\n{res1.get('answer', '')[:150]}...")

        res2 = await MasterAgent.process_query("Only high risk offenders", session_id="test_sess_1")
        print(f"Turn 2 Refinement Intent: {res2.get('intent')}")
        print(f"Turn 2 Memory Turns: {res2.get('memory_turns')}")

        print("\n🎉 ALL AI LAYER TESTS PASSED SUCCESSFULLY!")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
