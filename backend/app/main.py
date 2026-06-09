"""
RaceCast API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.routers import races, sessions, drivers, telemetry, events, weather, keys, rate_status, stats
from app.ws.manager import router as ws_router
from app.utils.config import settings
from app.utils.rate_limit import RateLimitMiddleware
from app.utils.cache import cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("RaceCast API starting...")
    # Auto-create tables on boot so a fresh DB is usable immediately.
    try:
        from app.db.database import engine, Base
        from app.db import models  # noqa: F401 — registers tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables ready.")
    except Exception as e:
        print(f"DB init skipped/failed (will retry on first query): {e}")
    print("Cache layer ready (L1=LRU, L2=Redis if reachable)")
    yield
    print("RaceCast API shutting down.")


app = FastAPI(
    title="RaceCast API",
    description="Formula 1 Replay and Telemetry Streaming Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware stack (order matters: outermost = last added) ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)


# ── Response time header ──────────────────────────────────────────────
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - start) * 1000, 1)
    response.headers["X-Response-Time"] = f"{ms}ms"
    return response


# ── Routers ───────────────────────────────────────────────────────────
app.include_router(races.router,          prefix="/races",     tags=["Races"])
app.include_router(sessions.router,       prefix="/sessions",  tags=["Sessions"])
app.include_router(drivers.router,        prefix="/drivers",   tags=["Drivers"])
app.include_router(telemetry.router,      prefix="/telemetry", tags=["Telemetry"])
app.include_router(events.router,         prefix="/events",    tags=["Events"])
app.include_router(weather.router,        prefix="/weather",   tags=["Weather"])
app.include_router(keys.router,           prefix="/keys",      tags=["API Keys"])
app.include_router(rate_status.router,                         tags=["Rate Limiting"])
app.include_router(stats.router,          prefix="/stats",     tags=["Platform Stats"])
app.include_router(ws_router)


# ── Core endpoints ────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "RaceCast API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/cache/stats", tags=["Cache"])
async def cache_stats():
    """Inspect L1/L2 cache performance."""
    return await cache.stats()


@app.delete("/cache/{pattern}", tags=["Cache"])
async def invalidate_cache(pattern: str):
    """Invalidate cache keys by prefix. E.g. DELETE /cache/races to clear all race caches."""
    await cache.invalidate_pattern(f"{pattern}*")
    return {"invalidated": pattern + "*"}
