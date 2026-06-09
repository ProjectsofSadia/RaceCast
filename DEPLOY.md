# RaceCast — Going Live Guide

> **Free stack:** Vercel (frontend) + Render (backend) + Neon (Postgres) + Upstash (Redis). All have no-card free tiers. A `render.yaml` blueprint is included — point Render at the repo and it auto-configures the backend.


Complete steps to deploy RaceCast with real Formula 1 data.

---

## Architecture

```
Vercel (frontend)  ──►  Railway (backend + Postgres + Redis)
                              │
                              └──►  FastF1 / OpenF1 (data source)
```

---

## 1. Provision infrastructure (Railway)

1. Create a Railway project.
2. Add a **PostgreSQL** plugin → copy its `DATABASE_URL`.
3. Add a **Redis** plugin → copy its `REDIS_URL`.

---

## 2. Configure the backend

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://...        # from Railway Postgres
REDIS_URL=redis://...                # from Railway Redis
CORS_ORIGINS=https://your-frontend.vercel.app
SECRET_KEY=<generate a long random string>
OPENF1_BASE_URL=https://api.openf1.org/v1
```

> FastF1 cache: on ephemeral hosts the importer writes to `/tmp/fastf1_cache`, which is fine — it re-downloads on cold start.

---

## 3. Import real data

The database starts empty. The API returns `"source": "demo"` until you populate it.

Run the importer (locally pointed at the Railway DB, or via a Railway one-off command):

```bash
cd backend
pip install -r requirements.txt

# One race to start (fast — ~2 min)
python -m app.services.importer --season 2025 --race Monaco --session Race

# A full weekend
python -m app.services.importer --season 2025 --race Monaco

# A whole season (slow — pulls every session, can take an hour+)
python -m app.services.importer --season 2025
```

The importer:
- Creates tables if missing
- Pulls laps + telemetry from FastF1
- Samples telemetry to ~10Hz to keep the DB lean
- Marks each session `imported=True` so re-runs skip it
- Bulk-upserts so it's safe to re-run

---

## 4. Deploy the backend (Railway)

```bash
# Railway auto-detects the Dockerfile in backend/
# Start command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Verify:
```bash
curl https://your-backend.up.railway.app/health
# {"status":"healthy"}

curl https://your-backend.up.railway.app/cache/stats
# shows L1 + Redis connected
```

---

## 5. Deploy the frontend (Vercel)

Set Vercel env vars:
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

> Note `wss://` (secure) in production, not `ws://`.

```bash
cd frontend
vercel --prod
```

---

## 6. Generate your first real API key

```bash
curl -X POST https://your-backend.up.railway.app/keys/ \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","email":"you@example.com","tier":"free"}'
```

Copy the `rc_...` key.

---

## 7. Confirm real data is flowing

```bash
curl "https://your-backend.up.railway.app/telemetry/?session_id=1&driver=VER" \
  -H "X-API-Key: rc_free_..."
```

Look for `"source": "db"` in the response. If you see `"source": "demo"`, the session isn't imported yet — go back to step 3.

---

## What works without the backend

The frontend runs standalone on Vercel with built-in demo data. Every page renders. The Playground REST + WebSocket fall back to demo responses if the API is offline. So you can ship the frontend first and wire the backend when ready.

---

## Production checklist

- [ ] Postgres + Redis provisioned
- [ ] Backend `.env` set with real URLs
- [ ] At least one session imported (`source: db` confirmed)
- [ ] Backend deployed, `/health` green
- [ ] Frontend env vars point at backend (`wss://` for WS)
- [ ] CORS_ORIGINS includes the Vercel domain
- [ ] First API key generated and tested
- [ ] Rotate any API keys/secrets shared during setup

---

## Render troubleshooting (real fixes)

**`failed to read dockerfile: open Dockerfile: no such file`**
Render is looking in the repo root. Set **Root Directory** = `backend` in service Settings (or use the included `render.yaml` via New → Blueprint).

**App boots then crashes on CORS / `SettingsError: error parsing value for field "CORS_ORIGINS"`**
Fixed in code — `CORS_ORIGINS` is now a plain comma-separated string. Set it to your Vercel URL, e.g. `https://race-cast.vercel.app` (no brackets, no quotes).

**`asyncpg` connection fails to Neon / `sslmode` error**
Fixed in code — the app strips `?sslmode=...` from the URL and attaches SSL via `connect_args`. Just paste the full Neon `DATABASE_URL` as-is.

**Redis (Upstash) won't connect**
Use the `rediss://` URL (TLS), not `redis://`. If Redis is unreachable the app still runs — caching falls back to in-process and rate limiting to in-memory.

**Required env vars on Render:**
```
DATABASE_URL   = postgresql://...neon.tech/neondb?sslmode=require
REDIS_URL      = rediss://default:...@...upstash.io:6379
SECRET_KEY     = (any long random string)
CORS_ORIGINS   = https://race-cast.vercel.app
```

**Start command** (auto from Dockerfile): binds to `$PORT` — no change needed.

Tables auto-create on first boot. To load real F1 data, run the importer once (locally pointed at your Neon URL):
```
DATABASE_URL="<neon url>" python -m app.services.importer --season 2025 --race Monaco --session Race
```
