"""
Rate limit status endpoint.
Returns current usage and limits for the calling client.
"""
import time
from fastapi import APIRouter, Request
from app.utils.rate_limit import (
    TIER_LIMITS, _get_client_id, _get_tier,
    _get_redis, _memory_store,
)

router = APIRouter()


@router.get("/rate-limit/status")
async def rate_limit_status(request: Request):
    client_id = _get_client_id(request)
    tier = _get_tier(request)
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["default"])

    # Count current minute usage
    now = time.time()
    redis = await _get_redis()

    if redis:
        key = f"racecast:rl:{client_id}:60"
        count = await redis.zcount(key, now - 60, now)
    else:
        q = _memory_store.get(client_id, [])
        count = sum(1 for t in q if t > now - 60)

    per_min = limits["per_minute"]
    remaining = max(0, per_min - count) if per_min < 9999 else -1

    return {
        "client_id": client_id[:20] + "...",
        "tier": tier,
        "window": "60s",
        "limit_per_minute": per_min if per_min < 9999 else "unlimited",
        "limit_per_month": limits["per_month"] if limits["per_month"] > 0 else "unlimited",
        "used_this_minute": count,
        "remaining_this_minute": remaining if remaining >= 0 else "unlimited",
        "backend": "redis" if redis else "memory",
        "upgrade_url": "https://racecast.dev/developer",
    }
