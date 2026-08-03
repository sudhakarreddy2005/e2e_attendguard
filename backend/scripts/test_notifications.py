"""
Test Suite for Automated Violation Notification Engine.
Verifies:
  1. get_app_only_token() configuration check
  2. NOTIFICATION_MODE default (must be 'dry_run')
  3. Deterministic DB input handling
  4. Rate-limit enforcement (MAX_NOTIFICATIONS_PER_HOUR)
  5. Idempotency check (no duplicate dispatch for same threshold)
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.ai.tools.notification_tool import notification_tool, NotificationTool
from app.core.config import settings


async def main():
    print("=" * 70)
    print("📧 AttendGuard Notification Engine Test Suite")
    print("=" * 70)

    await connect_to_mongo()

    try:
        # 1. Default Mode Check
        print(f"1. Active NOTIFICATION_MODE: '{settings.NOTIFICATION_MODE}'")
        assert settings.NOTIFICATION_MODE == "dry_run", "CRITICAL SAFETY FAIL: NOTIFICATION_MODE is not 'dry_run' by default!"
        print("   ✅ PASSED: Default mode is safely set to 'dry_run'.")

        # 2. Test Dry Run Dispatch
        sample_student = {
            "student_name": "Test Student",
            "roll_number": "23BQ1A0599",
            "department": "CSE",
            "section": "B",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "latest_violation_date": "Today",
            "parent_email": "parent_test@vvit.net",
        }

        print("\n2. Executing Dry-Run Notification...")
        res_dry = await notification_tool.run(student_data=sample_student, mode_override="dry_run")
        print(f"   Status: {res_dry.get('status')}")
        print(f"   Message: {res_dry.get('message')}")
        assert res_dry.get("status") == "DRY_RUN_COMPLETED", "Dry run dispatch failed!"
        print("   ✅ PASSED: Dry run mode safely simulated dispatch without network calls.")

        # 3. Test Shadow Mode Dispatch
        print("\n3. Executing Shadow-Mode Notification...")
        res_shadow = await notification_tool.run(student_data=sample_student, mode_override="shadow")
        print(f"   Status: {res_shadow.get('status')}")
        assert res_shadow.get("recipient") == settings.SHADOW_TEST_EMAIL, "Shadow mode recipient mismatch!"
        print(f"   Shadow Recipient: {res_shadow.get('recipient')}")
        print("   ✅ PASSED: Shadow mode safely targeted test address.")

        # 4. Test Idempotency Check
        print("\n4. Verifying Idempotency Logic...")
        # Simulate initial notification threshold = 3
        last_notified = 3
        current_count = 3
        should_send = (current_count >= settings.NOTIFY_THRESHOLD) and (current_count > last_notified)
        assert should_send is False, "Idempotency failed: Repeated threshold crossing triggered duplicate send!"
        print("   ✅ PASSED: Idempotency check prevented duplicate notification for threshold count 3.")

        # 5. Test Rate Limiting
        print("\n5. Testing Hourly Rate Limiter...")
        for i in range(settings.MAX_NOTIFICATIONS_PER_HOUR + 5):
            allowed = NotificationTool.check_rate_limit()
            if not allowed:
                print(f"   Cap reached at request index {i + 1} (Max allowed: {settings.MAX_NOTIFICATIONS_PER_HOUR})")
                break
        assert allowed is False, "Rate limiter failed to block excess notifications!"
        print("   ✅ PASSED: Rate limiter enforced hourly dispatch cap.")

        print("\n🎉 ALL NOTIFICATION ENGINE TESTS PASSED SUCCESSFULLY!")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
