"""
RaceCast Rate Limiter
---------------------
Sliding window rate limiting backed by Redis.
Real API key validation against PostgreSQL with cache.
"""
import time
import hashlib
from typing import Optional, Dict, Tuple
from collections import defaultdict, deque

from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.utils.config import settings

TIER_LIMITS: Dict[str, Dict[str, int]] = {
    "free":       {"per_minute": 60,   "per_month": 1_000},
    "pro":        {"per_minute": 600,  "per_month": 50_000},
    "enterprise": {"per_minute": 9999, "per_month": -1},
    "default":    {"per_minute": 100,  "per_month": -1},
}

EXEMPT_PATHS = {"/", "/health", "/docs", "/redoc", "/openapi.json", "/cache/stats"}
_memory_store: Dict[str, deque] = defaultdict(deque)


async def _lookup_key_tier(api_key: str) -> Optional[str]:
    """
    Look up API key tier from DB with cache.
    Cache TTL = 5 min so revoked keys are blocked within 5 min.
    """
    from app.utils.cache import cache
    cache_key = f"key_tier:{api_key[:32]}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    try:
        from app.db.database import AsyncSessionLocal
        from app.db.models import ApiKey
        from sqlalchemy import select, and_

        async with AsyncSessionLocal() as session:
            stmt = select(ApiKey.tier).where(
                and_(ApiKey.key == api_key, ApiKey.active == True)
            ).limit(1)
            result = await session.execute(stmt)
            row = result.scalar_one_or_none()

        if row:
            await cache.set(cache_key, row, ttl=300)
            return row
    except Exception:
        pass

    return None


def _get_raw_api_key(request: Request) -> Optional[str]:
    key = (
        request.headers.get("X-API-Key")
        or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        or request.query_params.get("api_key")
    )
    return key if key and key.startswith("rc_") else None


def _get_client_id(request: Request) -> str:
    api_key = _get_raw_api_key(request)
    if api_key:
        return f"key:{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else "unknown"
    )
    return f"ip:{ip}"


async def _get_tier(request: Request) -> str:
    api_key = _get_raw_api_key(request)
    if not api_key:
        return "default"
    tier = await _lookup_key_tier(api_key)
    return tier if tier else "invalid"


_redis_client = None

async def _get_redis():
    global _redis_client
    if _redis_client is None and REDIS_AVAILABLE:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL, decode_responses=True,
                socket_connect_timeout=2, socket_timeout=2,
            )
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


def _memory_check(client_id: str, limit: int, window: int) -> Tuple[bool, int, int]:
    now = time.time()
    q = _memory_store[client_id]
    while q and q[0] < now - window:
        q.popleft()
    count = len(q)
    if count >= limit:
        return False, 0, int(q[0] + window) if q else int(now + window)
    q.append(now)
    return True, limit - count - 1, int(now + window)


async def _redis_check(redis, client_id: str, limit: int, window: int) -> Tuple[bool, int, int]:
    now = time.time()
    key = f"racecast:rl:{client_id}:{window}"
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, window + 1)
    results = await pipe.execute()
    count = results[1]
    if count >= limit:
        oldest = await redis.zrange(key, 0, 0, withscores=True)
        reset_at = int(oldest[0][1] + window) if oldest else int(now + window)
        await redis.zrem(key, str(now))
        return False, 0, reset_at
    return True, limit - count - 1, int(now + window)


async def _increment_request_count(api_key: str):
    """Increment total request counter for billing/analytics."""
    if not api_key:
        return
    try:
        redis = await _get_redis()
        if redis:
            month_key = f"racecast:monthly:{api_key[:32]}:{time.strftime('%Y-%m')}"
            await redis.incr(month_key)
            await redis.expire(month_key, 86400 * 35)  # keep 35 days
    except Exception:
        pass


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXEMPT_PATHS or request.url.path.startswith("/ws"):
            return await call_next(request)

        client_id = _get_client_id(request)
        tier = await _get_tier(request)

        # Reject invalid keys outright
        if tier == "invalid":
            return JSONResponse(
                status_code=401,
                content={
                    "error": "invalid_api_key",
                    "message": "API key not found or inactive.",
                    "docs": "/docs",
                },
            )

        limits = TIER_LIMITS.get(tier, TIER_LIMITS["default"])
        limit_per_min = limits["per_minute"]

        if limit_per_min >= 9999:
            response = await call_next(request)
            response.headers["X-RateLimit-Tier"] = tier
            await _increment_request_count(_get_raw_api_key(request) or "")
            return response

        redis = await _get_redis()
        if redis:
            allowed, remaining, reset_at = await _redis_check(redis, client_id, limit_per_min, 60)
        else:
            allowed, remaining, reset_at = _memory_check(client_id, limit_per_min, 60)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Limit: {limit_per_min} req/min for tier '{tier}'.",
                    "tier": tier,
                    "retry_after": reset_at - int(time.time()),
                    "upgrade_url": "https://racecast.dev/developer",
                },
                headers={
                    "X-RateLimit-Limit":     str(limit_per_min),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset":     str(reset_at),
                    "X-RateLimit-Tier":      tier,
                    "Retry-After":           str(reset_at - int(time.time())),
                },
            )

        await _increment_request_count(_get_raw_api_key(request) or "")

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"]     = str(limit_per_min)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"]     = str(reset_at)
        response.headers["X-RateLimit-Tier"]      = tier
        return response


def rate_limit(limit: int = 60, window: int = 60):
    async def _check(request: Request):
        client_id = _get_client_id(request)
        key = f"{client_id}:route:{request.url.path}"
        redis = await _get_redis()
        if redis:
            allowed, remaining, reset_at = await _redis_check(redis, key, limit, window)
        else:
            allowed, remaining, reset_at = _memory_check(key, limit, window)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit: {limit} req/{window}s on this endpoint.",
                    "retry_after": reset_at - int(time.time()),
                },
            )
    return Depends(_check)


class WebSocketRateLimiter:
    def __init__(self, limit: int = 120, window: int = 60):
        self.limit = limit
        self.window = window

    async def allow(self, client_id: str) -> bool:
        redis = await _get_redis()
        if redis:
            allowed, _, _ = await _redis_check(redis, f"ws:{client_id}", self.limit, self.window)
        else:
            allowed, _, _ = _memory_check(f"ws:{client_id}", self.limit, self.window)
        return allowed
