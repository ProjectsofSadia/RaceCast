from fastapi import APIRouter, Query
from app.utils.cache import cache, TTL
import math

router = APIRouter()

@router.get("/")
async def get_weather(session_id: int = Query(...)):
    cache_key = f"weather:{session_id}"
    async def fetch():
        n = 70
        return {
            "session_id": session_id,
            "frames": [
                {
                    "lap": i+1,
                    "air_temp": round(24 + 3*math.sin(i*0.1), 1),
                    "track_temp": round(38 + 5*math.sin(i*0.08), 1),
                    "humidity": round(42 + 8*math.sin(i*0.12), 1),
                    "pressure": round(1013 + math.sin(i*0.05), 1),
                    "wind_speed": round(8 + 4*math.sin(i*0.15), 1),
                    "rainfall": 0,
                }
                for i in range(n)
            ]
        }
    return await cache.get_or_set(cache_key, fetch, ttl=TTL.WEATHER)
