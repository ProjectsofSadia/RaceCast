"""
API Key management — create, list, revoke, usage.
Persists to PostgreSQL; falls back gracefully if DB is unavailable.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets, hashlib, time

from app.db.database import get_db
from app.utils.cache import cache

router = APIRouter()

VALID_TIERS = {"free", "pro", "enterprise"}
TIER_LIMITS = {"free": 1000, "pro": 50000, "enterprise": -1}


class KeyRequest(BaseModel):
    name: str
    email: str
    tier: str = "free"


def _generate_key(tier: str) -> str:
    raw = secrets.token_urlsafe(32)
    suffix = hashlib.sha256(raw.encode()).hexdigest()[:40]
    # embed tier hint so middleware can validate without DB in dev
    return f"rc_{tier[:3]}_{suffix}"


@router.post("/")
async def create_key(req: KeyRequest, db: AsyncSession = Depends(get_db)):
    if req.tier not in VALID_TIERS:
        raise HTTPException(400, detail=f"Invalid tier. Choose from {VALID_TIERS}")

    key = _generate_key(req.tier)

    # Persist
    try:
        from app.db.models import ApiKey
        record = ApiKey(key=key, name=req.name, email=req.email, tier=req.tier, active=True)
        db.add(record)
        await db.flush()
    except Exception:
        pass  # demo mode without DB

    return {
        "key": key,
        "name": req.name,
        "email": req.email,
        "tier": req.tier,
        "rate_limit_per_month": TIER_LIMITS.get(req.tier, 1000),
        "message": "Store this key securely — it will not be shown again.",
    }


@router.get("/")
async def list_keys(email: str, db: AsyncSession = Depends(get_db)):
    """List all keys for an email (masked)."""
    try:
        from app.db.models import ApiKey
        result = await db.execute(select(ApiKey).where(ApiKey.email == email))
        keys = result.scalars().all()
        return {
            "count": len(keys),
            "keys": [
                {
                    "id": k.id,
                    "name": k.name,
                    "tier": k.tier,
                    "key_preview": k.key[:12] + "..." + k.key[-4:],
                    "active": k.active,
                    "created_at": k.created_at.isoformat() if k.created_at else None,
                }
                for k in keys
            ],
        }
    except Exception:
        return {"count": 0, "keys": [], "note": "DB unavailable — demo mode"}


@router.delete("/{key_id}")
async def revoke_key(key_id: int, db: AsyncSession = Depends(get_db)):
    """Revoke (deactivate) a key. Soft-delete keeps audit trail."""
    try:
        from app.db.models import ApiKey
        result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(404, detail="Key not found")
        record.active = False
        await db.flush()
        # Invalidate the tier cache so middleware blocks it within seconds
        await cache.delete(f"key_tier:{record.key[:32]}")
        return {"revoked": key_id, "key_preview": record.key[:12] + "..."}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, detail="DB unavailable")


@router.get("/{key_id}/usage")
async def key_usage(key_id: int, db: AsyncSession = Depends(get_db)):
    """Current month usage for a key."""
    try:
        from app.db.models import ApiKey
        result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(404, detail="Key not found")

        # Pull monthly counter from Redis
        used = 0
        try:
            from app.utils.rate_limit import _get_redis
            redis = await _get_redis()
            if redis:
                month_key = f"racecast:monthly:{record.key[:32]}:{time.strftime('%Y-%m')}"
                used = int(await redis.get(month_key) or 0)
        except Exception:
            pass

        limit = TIER_LIMITS.get(record.tier, 1000)
        return {
            "key_id": key_id,
            "tier": record.tier,
            "used_this_month": used,
            "limit": limit if limit > 0 else "unlimited",
            "remaining": (limit - used) if limit > 0 else "unlimited",
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, detail="DB unavailable")


@router.get("/tiers")
async def list_tiers():
    return [
        {"tier": "free", "price": 0, "requests_per_month": 1000, "ws_connections": 1,
         "features": ["REST API", "Historical data", "3 drivers max"]},
        {"tier": "pro", "price": 49, "requests_per_month": 50000, "ws_connections": 5,
         "features": ["REST API", "WebSocket streaming", "All drivers", "Export CSV"]},
        {"tier": "enterprise", "price": None, "requests_per_month": -1, "ws_connections": -1,
         "features": ["Unlimited", "SLA", "Custom integration", "Dedicated support"]},
    ]
