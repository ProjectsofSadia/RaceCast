from fastapi import APIRouter, Query
from app.utils.cache import cache, TTL

router = APIRouter()

DEMO_EVENTS = [
    {"lap":5,"event_type":"YELLOW_FLAG","description":"Yellow flag in sector 2","driver_code":None},
    {"lap":12,"event_type":"PIT_ENTRY","description":"VER pits for medium tyres","driver_code":"VER"},
    {"lap":18,"event_type":"SAFETY_CAR","description":"Safety car deployed","driver_code":None},
    {"lap":22,"event_type":"SAFETY_CAR_END","description":"Safety car withdrawn","driver_code":None},
    {"lap":28,"event_type":"PIT_ENTRY","description":"LEC pits for hard tyres","driver_code":"LEC"},
    {"lap":45,"event_type":"VSC","description":"Virtual safety car","driver_code":None},
    {"lap":47,"event_type":"VSC_END","description":"VSC withdrawn","driver_code":None},
    {"lap":56,"event_type":"PIT_ENTRY","description":"HAM pits for soft tyres","driver_code":"HAM"},
]

@router.get("/")
async def get_events(session_id: int = Query(...), driver: str = Query(None)):
    cache_key = f"events:{session_id}:{driver or 'all'}"
    async def fetch():
        events = DEMO_EVENTS
        if driver:
            events = [e for e in events if e["driver_code"] == driver or e["driver_code"] is None]
        return {"session_id": session_id, "count": len(events), "events": events}
    return await cache.get_or_set(cache_key, fetch, ttl=TTL.EVENTS)
