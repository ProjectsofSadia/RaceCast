from fastapi import APIRouter, Query

router = APIRouter()

SESSIONS = ["FP1","FP2","FP3","Q","Race"]

@router.get("/")
async def list_sessions(race_id: int = Query(...)):
    return [{"id": i+1, "race_id": race_id, "session_type": s, "imported": True} for i, s in enumerate(SESSIONS)]

@router.get("/{session_id}")
async def get_session(session_id: int):
    return {"id": session_id, "session_type": "Race", "race_id": 4, "imported": True}
