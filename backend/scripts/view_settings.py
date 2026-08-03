import asyncio
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.repositories.base import BaseRepository
from app.database import collections as C

class SettingsRepo(BaseRepository):
    collection_name = C.SETTINGS

async def main():
    await connect_to_mongo()
    repo = SettingsRepo()
    docs = await repo.find_many()
    print("=" * 80)
    print("SETTINGS COLLECTION DOCS:")
    print("=" * 80)
    for doc in docs:
        print(doc)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
