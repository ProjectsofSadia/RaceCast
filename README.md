# RaceCast

**Formula 1 Replay and Telemetry Streaming Platform**

> Replay Formula 1 Like It's Live.

A developer infrastructure product for Formula 1 data — historical replay, live telemetry streaming, and a REST + WebSocket API. Think "Stripe for F1 data."

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 · TypeScript · Tailwind · Framer Motion |
| Backend | FastAPI · PostgreSQL · Redis · WebSockets |
| Data | FastF1 · OpenF1 |
| Infra | Docker · Vercel · Railway |

---

## Features

**Frontend**
- Landing page with animated telemetry hero + F1 car intro (first-visit)
- Dashboard with live standings, real loading / empty / error states
- Replay workstation — timeline scrubbing, multi-driver telemetry
- Telemetry Explorer — multi-channel A-vs-B comparison
- Developer Portal — API key create / list / revoke / usage
- API Playground — REST builder + **real WebSocket tester**

**Backend**
- REST API: races, sessions, drivers, telemetry, events, weather, keys
- WebSocket streaming engine (10Hz, subscription-based)
- **Caching** — two-layer L1 (in-process LRU) + L2 (Redis), per-data-type TTLs
- **Rate limiting** — Redis sliding window, tier-aware, real API-key validation
- **Fast DB** — tuned connection pool, composite indexes, bulk upserts, downsampling
- **Real data** — FastF1 importer populates Postgres; API serves `source: db` with demo fallback

---

## Quickstart

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # → http://localhost:3000
```

### Full stack
```bash
docker-compose up --build
```

### Import real data
```bash
cd backend
python -m app.services.importer --season 2025 --race Monaco --session Race
```

See **DEPLOY.md** for the full going-live guide.

---

## WebSocket API

```js
const ws = new WebSocket('wss://api.racecast.dev/ws/stream')
ws.send(JSON.stringify({
  type: 'subscribe',
  season: 2025, race: 'monaco_gp', session: 'race',
  drivers: ['VER', 'LEC'],
  channels: ['speed', 'throttle', 'brake', 'gear', 'drs'],
}))
ws.onmessage = ({ data }) => console.log(JSON.parse(data))
```

---

## Project layout

```
backend/
  app/
    routers/      REST endpoints
    ws/           WebSocket engine
    services/     FastF1 importer + service
    db/           models, queries (optimized), database
    utils/        cache, rate_limit, config
frontend/
  src/
    app/          pages (App Router)
    components/   ui (States), layout (Nav)
    lib/          api client, design tokens
```

---

## Notes
- Frontend runs standalone with demo data — deploy it before the backend if you like.
- API returns `source: "demo"` until you import real sessions, then `source: "db"`.
- See `RaceCast-Design-Audit.md` for the product/design roadmap (Phases 1–3).
