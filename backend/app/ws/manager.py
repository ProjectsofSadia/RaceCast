"""
RaceCast WebSocket Streaming Engine
Handles subscriptions and broadcasts telemetry + timing data in real time.
"""
import asyncio
import json
from typing import Dict, Set, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dataclasses import dataclass, field
from app.utils.rate_limit import WebSocketRateLimiter

# One limiter instance shared across all WS connections
_ws_limiter = WebSocketRateLimiter(limit=120, window=60)  # 120 messages/min per client


@dataclass
class Subscription:
    season: int
    race: str
    session: str
    drivers: Set[str] = field(default_factory=set)
    channels: Set[str] = field(default_factory=set)


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Subscription] = {}

    async def connect(self, ws: WebSocket, client_id: str):
        await ws.accept()
        self.active[client_id] = ws
        print(f"WS connected: {client_id} | total: {len(self.active)}")

    def disconnect(self, client_id: str):
        self.active.pop(client_id, None)
        self.subscriptions.pop(client_id, None)
        print(f"WS disconnected: {client_id} | total: {len(self.active)}")

    def subscribe(self, client_id: str, data: dict):
        self.subscriptions[client_id] = Subscription(
            season=data.get("season", 2025),
            race=data.get("race", ""),
            session=data.get("session", "race"),
            drivers=set(data.get("drivers", [])),
            channels=set(data.get("channels", [])),
        )

    async def send(self, client_id: str, message: dict):
        ws = self.active.get(client_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(client_id)

    async def broadcast_to_subscribers(self, race: str, session: str, payload: dict):
        for cid, sub in list(self.subscriptions.items()):
            if sub.race == race and sub.session == session:
                filtered = {
                    "type": "data",
                    "driver": payload.get("driver"),
                    "timestamp": payload.get("timestamp"),
                    "data": {k: v for k, v in payload.get("data", {}).items() if k in sub.channels}
                }
                if payload.get("driver") in sub.drivers or not sub.drivers:
                    await self.send(cid, filtered)


manager = ConnectionManager()
router = APIRouter()


@router.websocket("/ws/stream")
async def websocket_endpoint(ws: WebSocket, client_id: Optional[str] = None):
    import uuid
    cid = client_id or str(uuid.uuid4())[:8]
    await manager.connect(ws, cid)

    await manager.send(cid, {
        "type": "connected",
        "client_id": cid,
        "message": "RaceCast WebSocket ready. Send a subscribe message to begin streaming.",
    })

    try:
        while True:
            raw = await ws.receive_text()

            # Rate limit incoming messages
            if not await _ws_limiter.allow(cid):
                await manager.send(cid, {
                    "type": "error",
                    "code": "ws_rate_limit_exceeded",
                    "message": "WebSocket message rate limit exceeded (120 msg/min). Slow down.",
                })
                continue

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send(cid, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type")

            if msg_type == "subscribe":
                manager.subscribe(cid, msg)
                sub = manager.subscriptions[cid]
                await manager.send(cid, {
                    "type": "subscribed",
                    "season": sub.season,
                    "race": sub.race,
                    "session": sub.session,
                    "drivers": list(sub.drivers),
                    "channels": list(sub.channels),
                })
                # Start streaming demo data if no real session
                asyncio.create_task(_demo_stream(cid, sub))

            elif msg_type == "unsubscribe":
                manager.subscriptions.pop(cid, None)
                await manager.send(cid, {"type": "unsubscribed"})

            elif msg_type == "ping":
                await manager.send(cid, {"type": "pong"})

            else:
                await manager.send(cid, {"type": "error", "message": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        manager.disconnect(cid)


async def _demo_stream(client_id: str, sub: Subscription):
    """Stream demo telemetry data when no live session is active."""
    import math, time, random
    drivers = list(sub.drivers) if sub.drivers else ["VER", "LEC"]
    t = 0
    while client_id in manager.active and client_id in manager.subscriptions:
        for driver in drivers:
            offset = hash(driver) % 100
            payload = {
                "type": "data",
                "driver": driver,
                "timestamp": int(time.time() * 1000),
                "lap": 1 + (t // 200),
                "data": {
                    "speed":    round(150 + 140 * abs(math.sin((t + offset) * 0.04)) + random.uniform(-3, 3), 1),
                    "throttle": round(max(0, min(100, 50 + 48 * math.sin((t + offset) * 0.07))), 1),
                    "brake":    round(max(0, min(100, 40 * math.sin((t + offset) * 0.12 + 1.5))), 1),
                    "rpm":      int(9000 + 5000 * abs(math.sin((t + offset) * 0.04)) + random.uniform(-200, 200)),
                    "gear":     max(1, min(8, int(3 + 4 * abs(math.sin((t + offset) * 0.04))))),
                    "drs":      1 if (t % 80) < 20 else 0,
                    "position": drivers.index(driver) + 1,
                    "lap_time": round(71.8 + random.uniform(-0.5, 1.2), 3),
                    "gap":      round(random.uniform(0.1, 3.5), 3) if drivers.index(driver) > 0 else 0,
                },
            }
            await manager.send(client_id, payload)
        t += 1
        await asyncio.sleep(0.1)
