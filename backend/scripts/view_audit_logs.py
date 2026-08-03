import asyncio
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.repositories.common_repositories import notification_audit_repo

async def main():
    await connect_to_mongo()
    print("=" * 80)
    print("NOTIFICATION AUDIT LOGS:")
    print("=" * 80)
    logs = await notification_audit_repo.find_many(limit=20, sort=[("timestamp", -1)])
    for log in logs:
        print(f"Time: {log.get('timestamp')}")
        print(f"Student: {log.get('student_id')}")
        print(f"Recipient: {log.get('recipient')}")
        print(f"Mode: {log.get('mode')}")
        print(f"Status: {log.get('status')}")
        print(f"Error: {log.get('error_message')}")
        print(f"Response: {log.get('provider_response')}")
        print("-" * 80)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
