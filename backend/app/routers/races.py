from fastapi import APIRouter, Query, Depends
from typing import Optional
from app.utils.cache import cache, TTL
from app.db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

router = APIRouter()

DEMO_RACES = [
    {"id":1,"season":2025,"round":1,"name":"Bahrain Grand Prix","circuit":"Bahrain International Circuit","country":"Bahrain","date":"2025-03-02"},
    {"id":2,"season":2025,"round":2,"name":"Saudi Arabian Grand Prix","circuit":"Jeddah Corniche Circuit","country":"Saudi Arabia","date":"2025-03-09"},
    {"id":3,"season":2025,"round":3,"name":"Australian Grand Prix","circuit":"Albert Park Circuit","country":"Australia","date":"2025-03-16"},
    {"id":4,"season":2025,"round":6,"name":"Monaco Grand Prix","circuit":"Circuit de Monaco","country":"Monaco","date":"2025-05-25"},
    {"id":5,"season":2025,"round":9,"name":"British Grand Prix","circuit":"Silverstone Circuit","country":"United Kingdom","date":"2025-07-06"},
    {"id":6,"season":2025,"round":15,"name":"Italian Grand Prix","circuit":"Autodromo Nazionale Monza","country":"Italy","date":"2025-09-07"},
    {"id":7,"season":2025,"round":19,"name":"United States Grand Prix","circuit":"Circuit of the Americas","country":"United States","date":"2025-10-19"},
    {"id":8,"season":2025,"round":22,"name":"Abu Dhabi Grand Prix","circuit":"Yas Marina Circuit","country":"United Arab Emirates","date":"2025-12-07"},
]

@router.get("/")
async def list_races(
    season: int = Query(2025),
    round: Optional[int] = None,
):
    cache_key = f"races:{season}:{round or 'all'}"

    async def fetch():
        races = [r for r in DEMO_RACES if r["season"] == season]
        if round:
            races = [r for r in races if r["round"] == round]
        return {"season": season, "count": len(races), "races": races}

    return await cache.get_or_set(cache_key, fetch, ttl=TTL.RACE_LIST)


@router.get("/{race_id}")
async def get_race(race_id: int):
    cache_key = f"race:{race_id}"

    async def fetch():
        race = next((r for r in DEMO_RACES if r["id"] == race_id), None)
        return race

    result = await cache.get_or_set(cache_key, fetch, ttl=TTL.RACE_LIST)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Race not found")
    return result
