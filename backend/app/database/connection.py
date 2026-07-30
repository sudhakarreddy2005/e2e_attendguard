"""
MongoDB connection management using Motor (async driver).

Provides a singleton connection pool that is initialized on app startup
and closed on shutdown. All database access goes through get_database().
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings
from app.core.logging import get_logger, LOGGER_DATABASE

logger = get_logger(LOGGER_DATABASE)

_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """Initialize the MongoDB connection pool. Called on app startup."""
    global _client, _database

    logger.info("Connecting to MongoDB at %s", settings.MONGO_URL)

    _client = AsyncIOMotorClient(
        settings.MONGO_URL,
        minPoolSize=settings.MONGO_MIN_POOL_SIZE,
        maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )

    _database = _client[settings.MONGO_DB]

    # Verify connection
    try:
        await _client.admin.command("ping")
        logger.info("Connected to MongoDB database: %s", settings.MONGO_DB)
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", str(e))
        raise


async def close_mongo_connection() -> None:
    """Close the MongoDB connection pool. Called on app shutdown."""
    global _client, _database

    if _client is not None:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """
    Get the active database instance.

    Must be called after connect_to_mongo() has been awaited.
    This is NOT async because Motor database objects are lazy —
    actual I/O happens when you call collection methods.
    """
    if _database is None:
        raise RuntimeError(
            "Database not initialized. Call connect_to_mongo() first."
        )
    return _database


def get_client() -> AsyncIOMotorClient:
    """Get the active client instance for operations requiring client access."""
    if _client is None:
        raise RuntimeError(
            "Database client not initialized. Call connect_to_mongo() first."
        )
    return _client
