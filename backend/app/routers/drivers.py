from fastapi import APIRouter, Query
from app.utils.cache import cache, TTL

router = APIRouter()

DRIVERS = [
    {"code":"VER","number":1,"first_name":"Max","last_name":"Verstappen","team":"Red Bull Racing","team_color":"#3671C6","season":2025},
    {"code":"NOR","number":4,"first_name":"Lando","last_name":"Norris","team":"McLaren","team_color":"#FF8000","season":2025},
    {"code":"LEC","number":16,"first_name":"Charles","last_name":"Leclerc","team":"Ferrari","team_color":"#E8002D","season":2025},
    {"code":"SAI","number":55,"first_name":"Carlos","last_name":"Sainz","team":"Ferrari","team_color":"#E8002D","season":2025},
    {"code":"HAM","number":44,"first_name":"Lewis","last_name":"Hamilton","team":"Ferrari","team_color":"#E8002D","season":2025},
    {"code":"RUS","number":63,"first_name":"George","last_name":"Russell","team":"Mercedes","team_color":"#27F4D2","season":2025},
    {"code":"ANT","number":12,"first_name":"Kimi","last_name":"Antonelli","team":"Mercedes","team_color":"#27F4D2","season":2025},
    {"code":"ALO","number":14,"first_name":"Fernando","last_name":"Alonso","team":"Aston Martin","team_color":"#229971","season":2025},
    {"code":"PIA","number":81,"first_name":"Oscar","last_name":"Piastri","team":"McLaren","team_color":"#FF8000","season":2025},
]

@router.get("/")
async def list_drivers(season: int = Query(2025)):
    async def fetch():
        d = [x for x in DRIVERS if x["season"] == season]
        return {"season": season, "count": len(d), "drivers": d}
    return await cache.get_or_set(f"drivers:{season}", fetch, ttl=TTL.DRIVER_LIST)

@router.get("/{code}")
async def get_driver(code: str):
    async def fetch():
        return next((d for d in DRIVERS if d["code"] == code.upper()), None)
    result = await cache.get_or_set(f"driver:{code.upper()}", fetch, ttl=TTL.DRIVER_LIST)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Driver not found")
    return result
