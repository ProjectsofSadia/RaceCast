from fastapi import APIRouter, Query, Depends
from typing import Optional
from app.utils.cache import cache, TTL
from app.db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import math, hashlib

router = APIRouter()


def _demo_telemetry(driver: str, n: int = 200, channels: Optional[str] = None):
    """Fallback demo data when DB has no real telemetry."""
    offset = (ord(driver[0]) + ord(driver[1])) % 60
    ch = set(channels.split(",")) if channels else None
    frames = []
    for i in range(n):
        t = i + offset
        frame = {"time_ms": i * 20}
        if not ch or "speed"    in ch: frame["speed"]    = round(max(60, 150 + 140 * abs(math.sin(t * 0.04))), 1)
        if not ch or "throttle" in ch: frame["throttle"] = round(max(0, min(100, 50 + 48 * math.sin(t * 0.07))), 1)
        if not ch or "brake"    in ch: frame["brake"]    = round(max(0, min(100, 40 * math.sin(t * 0.12 + 1.5))), 1)
        if not ch or "rpm"      in ch: frame["rpm"]      = int(9000 + 5000 * abs(math.sin(t * 0.04)))
        if not ch or "gear"     in ch: frame["gear"]     = max(1, min(8, int(3 + 4 * abs(math.sin(t * 0.04)))))
        if not ch or "drs"      in ch: frame["drs"]      = 1 if (i % 80) < 20 else 0
        frames.append(frame)
    return frames


@router.get("/")
async def get_telemetry(
    session_id: int = Query(...),
    driver: str = Query(...),
    lap: Optional[int] = Query(None),
    channels: Optional[str] = Query(None),
    downsample: int = Query(1, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    key = f"telemetry:{hashlib.md5(f'{session_id}:{driver}:{lap}:{channels}:{downsample}'.encode()).hexdigest()[:12]}"

    async def fetch():
        from app.db.queries import get_telemetry_fast
        ch_list = channels.split(",") if channels else None
        data = await get_telemetry_fast(db, session_id, driver.upper(), lap, ch_list, downsample)
        if not data:
            data = _demo_telemetry(driver, channels=channels)
            if downsample > 1:
                data = data[::downsample]
        return {"session_id": session_id, "driver": driver.upper(), "lap": lap, "frames": len(data), "data": data, "source": "db" if data else "demo"}

    return await cache.get_or_set(key, fetch, ttl=TTL.TELEMETRY)


@router.get("/compare")
async def compare_telemetry(
    session_id: int = Query(...),
    driver_a: str = Query(...),
    driver_b: str = Query(...),
    lap: Optional[int] = Query(None),
    downsample: int = Query(2, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    key = f"telemetry:compare:{session_id}:{driver_a}:{driver_b}:{lap}:{downsample}"

    async def fetch():
        from app.db.queries import get_telemetry_fast
        da = await get_telemetry_fast(db, session_id, driver_a.upper(), lap, None, downsample)
        db_data = await get_telemetry_fast(db, session_id, driver_b.upper(), lap, None, downsample)
        if not da: da = _demo_telemetry(driver_a)[::downsample]
        if not db_data: db_data = _demo_telemetry(driver_b)[::downsample]
        return {
            "session_id": session_id, "lap": lap,
            "driver_a": {"code": driver_a.upper(), "data": da},
            "driver_b": {"code": driver_b.upper(), "data": db_data},
        }

    return await cache.get_or_set(key, fetch, ttl=TTL.TELEMETRY)


@router.get("/fastest-lap")
async def fastest_lap(
    session_id: int = Query(...),
    driver: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    key = f"fastest_lap:{session_id}:{driver}"

    async def fetch():
        from app.db.queries import get_fastest_lap, get_telemetry_fast
        lap_info = await get_fastest_lap(db, session_id, driver.upper())
        if lap_info:
            tel = await get_telemetry_fast(db, session_id, driver.upper(), lap_info["lap_number"], downsample=2)
        else:
            lap_info = {"lap_number": 1, "lap_time_ms": 71842, "compound": "SOFT"}
            tel = _demo_telemetry(driver)
        return {"session_id": session_id, "driver": driver.upper(), **lap_info, "telemetry": tel}

    return await cache.get_or_set(key, fetch, ttl=TTL.LAP_DATA)


@router.get("/laps")
async def get_laps(
    session_id: int = Query(...),
    driver: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    key = f"laps:{session_id}:{driver}"

    async def fetch():
        from app.db.queries import get_laps_fast
        data = await get_laps_fast(db, session_id, driver.upper())
        return {"session_id": session_id, "driver": driver.upper(), "count": len(data), "laps": data}

    return await cache.get_or_set(key, fetch, ttl=TTL.LAP_DATA)


@router.get("/leaderboard")
async def leaderboard(
    session_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    key = f"leaderboard:{session_id}"

    async def fetch():
        from app.db.queries import get_session_leaderboard
        data = await get_session_leaderboard(db, session_id)
        return {"session_id": session_id, "count": len(data), "standings": data}

    return await cache.get_or_set(key, fetch, ttl=TTL.LEADERBOARD)
