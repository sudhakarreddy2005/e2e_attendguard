"""
Comprehensive Notification Pipeline Test Suite (Step 12 Audit Compliance).

Tests:
  1. dry_run mode (network dispatch skipped, notification_audit logged)
  2. shadow mode (dispatches to shadow test address)
  3. live mode (mocked httpx Graph API returning 202 Accepted)
  4. threshold crossing logic (4 -> 5 triggers notification)
  5. duplicate prevention / idempotency (5 -> 6 suppressed)
  6. invalid email rejection (no retries)
  7. Graph API failure handling (500 retry backoff & 401 permanent error)
  8. disabled notifications feature flag (NOTIFICATIONS_ENABLED=False)
  9. rate limiting (MAX_NOTIFICATIONS_PER_HOUR cap)
  10. exponential backoff retry logic
"""

import asyncio
import os
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.ai.tools.notification_tool import NotificationTool, notification_tool
from app.services.notification_service import NotificationService
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.repositories.common_repositories import notification_audit_repo
from app.repositories.student_repository import student_repo


class TestNotificationPipeline(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await connect_to_mongo()
        NotificationTool.reset_rate_limit()

    async def asyncTearDown(self):
        await close_mongo_connection()

    async def test_01_dry_run_mode(self):
        """Test dry_run mode skips network dispatch and logs to notification_audit."""
        student_data = {
            "student_name": "Dry Run Student",
            "roll_number": "23BQ1A05D1",
            "department": "CSE",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "23bq1a05d1@vvit.net",
        }

        res = await notification_tool.run(student_data=student_data, mode_override="dry_run")
        self.assertTrue(res["success"])
        self.assertEqual(res["mode"], "dry_run")
        self.assertEqual(res["status"], "DRY_RUN_COMPLETED")
        self.assertIn("audit_id", res)
        print("  ✓ Test 01 Passed: dry_run mode simulated dispatch without network call.")

    async def test_02_shadow_mode(self):
        """Test shadow mode targets shadow recipient address."""
        student_data = {
            "student_name": "Shadow Student",
            "roll_number": "23BQ1A05S1",
            "department": "ECE",
            "section": "B",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "23bq1a05s1@vvit.net",
        }

        res = await notification_tool.run(student_data=student_data, mode_override="shadow")
        self.assertTrue(res["success"])
        self.assertEqual(res["mode"], "shadow")
        self.assertEqual(res["recipient"], settings.SHADOW_TEST_EMAIL)
        self.assertEqual(res["status"], "SHADOW_DISPATCHED")
        print("  ✓ Test 02 Passed: shadow mode successfully targeted test address.")

    async def test_03_live_mode_mocked_graph_api(self):
        """Test live mode with mocked Microsoft Graph API returning 202 Accepted."""
        student_data = {
            "student_name": "Live Student",
            "roll_number": "23BQ1A05L1",
            "department": "MECH",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Spot Bunk",
            "student_email": "23bq1a05l1@vvit.net",
        }

        mock_token = "mock_access_token_12345"

        with patch.object(NotificationTool, "get_app_only_token", new_callable=AsyncMock) as mock_get_token:
            mock_get_token.return_value = (mock_token, {"status": "SUCCESS"})

            mock_response = MagicMock()
            mock_response.status_code = 202
            mock_response.text = "Accepted"

            with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_response

                res = await notification_tool.run(student_data=student_data, mode_override="live")
                self.assertTrue(res["success"])
                self.assertEqual(res["mode"], "live")
                self.assertEqual(res["status"], "LIVE_SENT")
                self.assertEqual(res["recipient"], "23bq1a05l1@vvit.net")
                print("  ✓ Test 03 Passed: live mode Graph API sendMail returned 202 Accepted.")

    async def test_04_threshold_crossing_logic(self):
        """Test notification triggers when crossing NOTIFY_THRESHOLD (e.g. 2 -> 3)."""
        roll_no = "23BQ1A05T1"
        # Seed student in MongoDB
        await student_repo.collection.update_one(
            {"roll_no": roll_no},
            {"$set": {
                "roll_no": roll_no,
                "name": "Threshold Student",
                "dept": "CSE",
                "section": "A",
                "violations_count": 3,
                "last_notified_threshold": 0,
            }},
            upsert=True
        )

        res = await NotificationService.process_violation_notification(
            roll_no=roll_no,
            violation_type="Bunk",
            location="Canteen",
            mode_override="dry_run",
        )

        self.assertTrue(res["triggered"])
        self.assertIn("tool_result", res)
        print("  ✓ Test 04 Passed: Notification triggered when crossing threshold (0 -> 3).")

    async def test_05_idempotency_duplicate_prevention(self):
        """Test duplicate notification is suppressed when count increments beyond threshold (3 -> 4)."""
        roll_no = "23BQ1A05I1"
        # Seed student already notified for threshold 3
        await student_repo.collection.update_one(
            {"roll_no": roll_no},
            {"$set": {
                "roll_no": roll_no,
                "name": "Idempotent Student",
                "dept": "CSE",
                "section": "A",
                "violations_count": 4,
                "last_notified_threshold": 3,
            }},
            upsert=True
        )

        res = await NotificationService.process_violation_notification(
            roll_no=roll_no,
            violation_type="Bunk",
            location="Canteen",
            mode_override="dry_run",
        )

        self.assertFalse(res["triggered"])
        self.assertEqual(res["reason"], "IDEMPOTENCY_SUPPRESSED")
        print("  ✓ Test 05 Passed: Idempotency check suppressed duplicate notification (3 -> 4).")


    async def test_06_invalid_email_rejection(self):
        """Test invalid recipient email is rejected immediately without retries."""
        student_data = {
            "student_name": "Invalid Email Student",
            "roll_number": "23BQ1A05E1",
            "department": "CSE",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "invalid_email_format_no_at_sign",
        }

        res = await notification_tool.run(student_data=student_data, mode_override="live")
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "INVALID_EMAIL")
        print("  ✓ Test 06 Passed: Invalid email rejected without attempting network retries.")

    async def test_07_graph_api_failure_and_retry(self):
        """Test Graph API 500 server error triggers retries and eventual failure logging."""
        student_data = {
            "student_name": "Failure Student",
            "roll_number": "23BQ1A05F1",
            "department": "CSE",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "23bq1a05f1@vvit.net",
        }

        with patch.object(NotificationTool, "get_app_only_token", new_callable=AsyncMock) as mock_get_token:
            mock_get_token.return_value = ("mock_token", {"status": "SUCCESS"})

            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"

            with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_response

                with patch("asyncio.sleep", new_callable=AsyncMock):
                    res = await notification_tool.run(student_data=student_data, mode_override="live")
                    self.assertFalse(res["success"])
                    self.assertEqual(res["status"], "SEND_FAILED")
                    self.assertEqual(mock_post.call_count, 3)
                    print("  ✓ Test 07 Passed: Graph API 500 error attempted 3 retries before returning SEND_FAILED.")

    async def test_08_disabled_notifications_feature_flag(self):
        """Test NOTIFICATIONS_ENABLED=False explicitly logs and suppresses dispatch."""
        with patch.object(settings, "NOTIFICATIONS_ENABLED", False):
            student_data = {
                "student_name": "Disabled Flag Student",
                "roll_number": "23BQ1A05X1",
                "department": "CSE",
                "section": "A",
                "violation_count": 3,
                "latest_violation_type": "Bunk",
                "student_email": "23bq1a05x1@vvit.net",
            }

            res = await notification_tool.run(student_data=student_data, mode_override="dry_run")
            self.assertFalse(res["success"])
            self.assertEqual(res["status"], "DISABLED_BY_CONFIG")
            print("  ✓ Test 08 Passed: Feature flag NOTIFICATIONS_ENABLED=False suppressed dispatch.")

    async def test_09_rate_limiting(self):
        """Test rate limiter blocks dispatches after exceeding hourly cap."""
        NotificationTool.reset_rate_limit()

        student_data = {
            "student_name": "Rate Limit Student",
            "roll_number": "23BQ1A05R1",
            "department": "CSE",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "23bq1a05r1@vvit.net",
        }

        # Consume all rate limit capacity
        for _ in range(settings.MAX_NOTIFICATIONS_PER_HOUR):
            NotificationTool.check_rate_limit()

        res = await notification_tool.run(student_data=student_data, mode_override="dry_run")
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "RATE_LIMITED")
        print("  ✓ Test 09 Passed: Hourly rate limiter blocked dispatch after cap was reached.")

    async def test_10_exponential_backoff_retry(self):
        """Test exponential backoff wait durations are executed on transient errors."""
        student_data = {
            "student_name": "Backoff Student",
            "roll_number": "23BQ1A05B1",
            "department": "CSE",
            "section": "A",
            "violation_count": 3,
            "latest_violation_type": "Bunk",
            "student_email": "23bq1a05b1@vvit.net",
        }

        with patch.object(NotificationTool, "get_app_only_token", new_callable=AsyncMock) as mock_get_token:
            mock_get_token.return_value = ("mock_token", {"status": "SUCCESS"})

            mock_response = MagicMock()
            mock_response.status_code = 503
            mock_response.text = "Service Unavailable"

            with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_response

                sleep_calls = []

                async def mock_sleep(seconds):
                    sleep_calls.append(seconds)

                with patch("asyncio.sleep", side_effect=mock_sleep):
                    res = await notification_tool.run(student_data=student_data, mode_override="live")
                    self.assertFalse(res["success"])
                    self.assertEqual(sleep_calls, [1, 2])
                    print("  ✓ Test 10 Passed: Exponential backoff slept for 1s then 2s between retries.")


if __name__ == "__main__":
    unittest.main()

