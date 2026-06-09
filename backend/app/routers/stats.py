"""
Platform stats — real metrics computed from the database and cache.
Infrastructure/fleet metrics that can't be measured on a single host are
clearly labeled as illustrative in the response (`illustrative: true`).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
import time

from app.db.database import get_db
from app.utils.cache import cache, TTL

router = APIRouter()


@router.get("/platform")
async def platform_stats(db: AsyncSession = Depends(get_db)):
    """Real counts from the DB. Cached 60s."""
    async def fetch():
        from app.db.models import Race, Session, Lap, TelemetryFrame

        try:
            races = (await db.execute(select(func.count(Race.id)))).scalar() or 0
            sessions = (await db.execute(select(func.count(Session.id)))).scalar() or 0
            imported = (await db.execute(
                select(func.count(Session.id)).where(Session.imported == True)
            )).scalar() or 0
            laps = (await db.execute(select(func.count(Lap.id)))).scalar() or 0
            telemetry = (await db.execute(select(func.count(TelemetryFrame.id)))).scalar() or 0
        except Exception:
            races = sessions = imported = laps = telemetry = 0

        # Real request count from rate limiter monthly counters (sum across keys)
        api_requests = 0
        try:
            from app.utils.rate_limit import _get_redis
            redis = await _get_redis()
            if redis:
                month = time.strftime("%Y-%m")
                cursor = 0
                pattern = f"racecast:monthly:*:{month}"
                while True:
                    cursor, keys = await redis.scan(cursor, match=pattern, count=100)
                    for k in keys:
                        api_requests += int(await redis.get(k) or 0)
                    if cursor == 0:
                        break
        except Exception:
            pass

        return {
            "real": {
                "races_indexed": races,
                "sessions_total": sessions,
                "sessions_imported": imported,
                "laps_recorded": laps,
                "telemetry_records": telemetry,
                "api_requests_month": api_requests,
            },
            # These describe a global server fleet — not measurable on a single
            # host, shown for product completeness and clearly flagged.
            "illustrative": {
                "active_regions": 14,
                "primary_node": "NODE_EU_WEST_1 · Frankfurt Hub",
                "node_jitter_ms": 0.4,
                "cpu_load_pct": 32.4,
                "throughput": "1.2 TB/s",
                "note": "Fleet metrics are illustrative on single-host deployments.",
            },
        }

    return await cache.get_or_set("stats:platform", fetch, ttl=60)


@router.get("/recent-sessions")
async def recent_sessions(db: AsyncSession = Depends(get_db)):
    """Recent imported sessions with real data sizes (estimated from row counts)."""
    async def fetch():
        from app.db.models import Race, Session, TelemetryFrame
        try:
            stmt = (
                select(Race.name, Race.circuit, Session.id, Session.imported)
                .join(Session, Session.race_id == Race.id)
                .order_by(Session.id.desc())
                .limit(8)
            )
            rows = (await db.execute(stmt)).all()
            out = []
            for name, circuit, sid, imported in rows:
                tel_count = (await db.execute(
                    select(func.count(TelemetryFrame.id)).where(TelemetryFrame.session_id == sid)
                )).scalar() or 0
                # ~80 bytes per telemetry row, rough estimate
                gb = round(tel_count * 80 / 1e9, 2)
                out.append({
                    "name": name,
                    "circuit": circuit,
                    "status": "ARCHIVED" if imported else "PROCESSING",
                    "telemetry_rows": tel_count,
                    "data_size_gb": gb,
                })
            return {"count": len(out), "sessions": out}
        except Exception:
            return {"count": 0, "sessions": []}

    return await cache.get_or_set("stats:recent_sessions", fetch, ttl=60)
