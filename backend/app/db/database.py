from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from app.utils.config import settings
import ssl

# ── Normalize the database URL ────────────────────────────────────────
# Neon / managed Postgres hand you:
#   postgresql://user:pass@host/db?sslmode=require&channel_binding=require
# asyncpg does NOT understand sslmode / channel_binding query params —
# they must be stripped and SSL passed via connect_args instead.
raw = settings.DATABASE_URL

# Strip query params that asyncpg can't parse
needs_ssl = "sslmode" in raw or "neon.tech" in raw or "render.com" in raw or "upstash" in raw
if "?" in raw:
    raw = raw.split("?", 1)[0]

DB_URL = raw.replace("postgresql://", "postgresql+asyncpg://")

connect_args = {
    "statement_cache_size": 0,   # 0 for pgbouncer/Neon poolers (safe default)
    "command_timeout": 30,
    "server_settings": {
        "jit": "off",
        "application_name": "racecast",
    },
}

# Attach SSL for managed providers
if needs_ssl:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    DB_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=10,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
