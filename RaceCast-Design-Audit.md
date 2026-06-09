# RaceCast — Product & Design Audit

**Goal:** Elevate RaceCast from a student-dashboard feel to Series-A developer-infrastructure quality, in the spirit of Stripe, Linear, Vercel, Datadog, and Retool — while preserving the existing dark/orange motorsport aesthetic.

**Method:** This audit is based on the actual RaceCast codebase (Next.js 14 frontend + FastAPI backend) rather than screenshots, so it speaks to real component structure, not just surface appearance.

**Bar being measured against:** Not "does it work" — it works. The bar is "would a developer pay for this and trust it with production traffic."

---

## Part 1 — Why it currently reads as "vibe coded"

These are the tells, ordered by how much they give the game away.

### 1.1 The product is all happy-path, no states
The single biggest signal. Every page assumes data exists and renders it instantly and identically on every load. There are no loading skeletons, no empty states, no error boundaries, no stale-while-revalidate, no partial-data handling. Stripe and Linear feel expensive *because* they handle the unglamorous states well. Infrastructure products are mostly states; RaceCast is mostly one state.

### 1.2 Data is hardcoded inside components
Demo arrays live inside the page files instead of being fetched. There is no request lifecycle, so there is nothing to put a loading or error state around. This is the structural root cause of 1.1.

### 1.3 Color is inline hex, repeated everywhere
`#FF5A1F` appears dozens of times across files as a string literal. The same orange, the same card color `#111111`, the same border `#1C1C1C` — all duplicated. This is invisible to a casual look but means the design can drift one edit at a time, and it signals no design-token discipline.

### 1.4 Spacing and type are chosen by feel
`py-3` here, `py-4` there, `py-8` elsewhere — picked locally, not from a scale. Font sizes set per element. There is no vertical rhythm, which the eye reads as "slightly off" without knowing why.

### 1.5 Charts are bespoke per page
Each page hand-rolls its own canvas drawing. No shared charting primitive means inconsistent axes, no shared cursor behavior, and four places to fix any chart bug.

### 1.6 The intro animation signals "portfolio"
The F1-car intro is genuinely fun, but infrastructure products do not animate a vehicle before showing you a dashboard. Stripe shows you your data. Keep the animation as an optional first-visit easter egg, not a forced gate on every load.

---

## Part 2 — Page-by-page audit

Each page is reviewed across UX, information architecture (IA), product design, visual design, accessibility (a11y), and engineering complexity, then given an impact rating.

### 2.1 Landing Page

- **UX:** Clear headline, good scroll narrative, sensible CTAs. The live WebSocket preview is a strong idea.
- **IA:** Logical top-to-bottom. Missing a "social proof" tier and a "docs/quickstart" entry point above the fold for developers who skip marketing.
- **Product design:** No trust signals — no logos, no real latency/uptime numbers, no "X requests served." Developers buy infra on trust; there's none shown.
- **Visual design:** Strongest page already. Hero animation and typography are good.
- **A11y:** Animated canvas has no `prefers-reduced-motion` guard. Color-only status indicators. Contrast on `#7A7A7A` secondary text over `#090909` is borderline (~4.3:1) — passes AA for large text, fails for small.
- **Engineering:** Low. Canvas already isolated.
- **Impact: MEDIUM.** It's the best page; polish, don't rebuild.

### 2.2 Overview / Dashboard

- **UX:** Looks live but is static. No sense of "when was this updated."
- **IA:** Standings + telemetry + events is the right grouping. But the standings table is built for 8 drivers; a real grid is 20.
- **Product design:** No "no active session" empty state — the most common real-world state for an F1 data product (races happen ~23 weekends a year; the other 329 days there is no live session). This is the highest-value missing state in the app.
- **Visual design:** Solid. Tire-compound badges and team-color bars are a nice touch and worth keeping as a pattern.
- **A11y:** Live-pulse dot is color + animation only; needs a text label. Table lacks scope headers.
- **Engineering:** Medium — needs real data wiring + skeleton + empty state.
- **Impact: HIGH.** This is what users stare at.

### 2.3 Replay

- **UX:** Most ambitious page. Timeline scrubbing is good. But there's no buffering indicator, no "this session isn't imported yet" state, and no feedback when telemetry is still loading.
- **IA:** Three-panel layout (filters / playback / race-control) is correct and matches PITWALL-class tools.
- **Product design:** Missing the entire "data not ready" path. With real data, most session+driver combinations will need a loading or import-pending state.
- **Visual design:** Good. Consistent with the rest.
- **A11y:** Timeline is click-only; no keyboard scrubbing (arrow keys), no ARIA slider role.
- **Engineering:** HIGH. The mini-charts redraw the full canvas every animation frame — fine for demo data, a performance cliff with real 10Hz telemetry across multiple drivers. Needs incremental redraw or offscreen canvas.
- **Impact: HIGH** and **highest engineering risk.**

### 2.4 Telemetry Explorer

- **UX:** Multi-channel A-vs-B comparison is the right concept. Channel toggles work well.
- **IA:** Driver selectors + channel list + chart is clean.
- **Product design:** Missing PITWALL's killer feature — **cursor synchronization** across channels (hover one channel, see the same track position in all). Export button is not wired. No axis units shown.
- **Visual design:** The two-driver color coding (orange/blue) is clear.
- **A11y:** Canvas charts are entirely invisible to screen readers; needs a data-table fallback or ARIA description.
- **Engineering:** Medium-high. Cursor sync is the meaningful lift.
- **Impact: MEDIUM-HIGH.**

### 2.5 API Explorer / Playground

- **UX:** Closest to Stripe-quality intent already. Request builder + response viewer is the right model.
- **IA:** REST and WebSocket tabs are well separated.
- **Product design:** The WebSocket tester is **fake** — it simulates frames locally instead of connecting to the real `/ws/stream`. Wiring it to the real endpoint is the single highest-credibility-per-hour change in the whole product.
- **Visual design:** Good monospace treatment, good response formatting.
- **A11y:** Editable JSON textarea lacks a label; response region should be a live region.
- **Engineering:** LOW to make real (the backend WS already exists and streams).
- **Impact: HIGH, low effort** — do this in Phase 1.

### 2.6 Developer Portal

- **UX:** Key generation flow works. But real dev portals are mostly *key management*, not key creation.
- **IA:** Missing the core object: a list of your existing keys with usage and a revoke action.
- **Product design:** Usage metrics are fake numbers. No way to see or revoke keys. No regenerate. The backend now supports real key validation and monthly counters, so the data exists to make this real.
- **Visual design:** Consistent.
- **A11y:** Generated-key reveal should be copyable with a labeled button, not just selectable text.
- **Engineering:** Medium — needs a `GET /keys` (list) and `DELETE /keys/{id}` (revoke) plus wiring.
- **Impact: HIGH.**

### 2.7 Documentation

- **Status: does not exist.**
- For a developer-infrastructure product, docs are not a supporting page — they are the product surface developers spend the most time in. Stripe is, functionally, documentation with an API attached.
- **Needs:** quickstart, authentication, REST reference, WebSocket reference, rate-limit/tier explanation, runnable examples, SDK pages.
- **Engineering:** Medium-high (content-heavy). Can start as MDX in-repo.
- **Impact: CRITICAL — currently zero.**

### 2.8 Settings

- **Status: does not exist.**
- Low priority until there is authentication. Once auth exists: profile, API keys (shared with Developer Portal), billing/tier, danger zone.
- **Impact: LOW until auth ships.**

---

## Part 3 — Architecture audit

### 3.1 Dead / duplicate / weak structure
- **Duplicated theme constants:** `#FF5A1F`, `#090909`, `#111111`, `#1C1C1C`, `#7A7A7A` repeated across every page file. → Extract to tokens.
- **Duplicated chart logic:** each page re-implements canvas drawing. → One `<TelemetryChart>` primitive.
- **Duplicated nav link arrays / layout wrappers** between pages. → Already partly solved by `Nav.tsx`; finish the job with a shared page-shell component.
- **Mock data inside components:** should move to a `lib/api.ts` data layer so components become state-driven.

### 3.2 Missing states (the big one)
| State | Pages missing it |
|---|---|
| Loading skeleton | All data pages |
| Empty state | Dashboard, Replay, Telemetry, Developer Portal |
| Error boundary | All data pages |
| "Not imported yet" | Replay, Telemetry |
| Partial / stale data | All live pages |

### 3.3 Recommended information architecture
```
/                      Landing (marketing + live proof)
/dashboard             Live/last session overview
/replay                Historical replay workstation
/telemetry             Multi-channel comparison
/developer             Keys, usage, revoke   ← real key mgmt
/playground            REST + real WS tester
/docs                  Quickstart, REST, WS, auth, rate limits, SDKs
/settings              Profile, billing (post-auth)
```

### 3.4 Recommended component hierarchy
```
components/
  layout/
    Nav.tsx
    PageShell.tsx        ← new: consistent padding/max-width/states
  ui/
    Card.tsx
    Badge.tsx            ← tire compounds, status
    Button.tsx
    Skeleton.tsx         ← new
    EmptyState.tsx       ← new
    ErrorState.tsx       ← new
    StatusDot.tsx        ← color + text label (a11y)
  charts/
    TelemetryChart.tsx   ← single primitive, axis units, cursor sync
    Sparkline.tsx
  data/
    DriverRow.tsx
    EventFeed.tsx
lib/
  api.ts                 ← all fetch calls, typed
  tokens.ts              ← single source for color/space/type
  useTelemetry.ts        ← data hooks w/ loading+error
```

---

## Part 4 — Design system recommendations

### 4.1 Tokens (single source of truth)
Create `lib/tokens.ts` and a matching Tailwind theme extension. Stop writing hex inline.
```ts
export const color = {
  bg:        '#090909',
  surface:   '#111111',
  border:    '#1C1C1C',
  primary:   '#FF5A1F',
  text:      '#FFFFFF',
  muted:     '#9A9AA5', // raised from #7A7A7A for AA contrast
  // semantic
  good: '#22C55E', warn: '#EAB308', bad: '#EF4444', info: '#3B82F6',
  // tire compounds
  soft: '#E01C2E', medium: '#E8960A', hard: '#9A9AA5', inter: '#1A7FE8',
}
```
Note: the current secondary `#7A7A7A` fails AA for small text on `#090909`. Raising it to ~`#9A9AA5` fixes contrast without changing the feel.

### 4.2 Spacing — 8px grid, enforced
Only use `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. No arbitrary `py-3` mixed with `py-7`.

### 4.3 Type scale — fixed steps
`11 / 12 / 14 / 16 / 20 / 28 / 40 / 56`. Mono (`Geist Mono`/`JetBrains Mono`) for all numbers, lap times, telemetry, code. Sans (`Inter`) for prose and labels.

### 4.4 Tailwind recommendations
- Move all tokens into `tailwind.config.ts` `theme.extend` so classes read `bg-surface`, `text-muted`, `border-border` — never raw hex.
- Add a `prefers-reduced-motion` variant and gate the hero/intro animations behind it.
- Define one `card` component class (border + radius + surface) instead of repeating the trio everywhere.

### 4.5 Framer Motion recommendations
- Standardize on **two** transitions only: a `fast` (150ms, ease-out) for UI feedback and a `entrance` (400ms, spring) for content reveals. Right now durations are picked per-use.
- Wrap all entrance animations so they no-op under `prefers-reduced-motion`.
- Demote the F1-car intro to first-visit-only (store a flag), not every navigation.
- Use `layout` animations for the live standings table re-sorting — that single touch makes the dashboard feel alive and is very on-brand for motorsport timing towers.

---

## Part 5 — Phased implementation plan

### Phase 1 — Quick wins (1–2 days)
Removes ~70% of the "vibe coded" feel.
1. Extract `lib/tokens.ts` + Tailwind theme; replace inline hex.
2. Wire the **API Playground + WebSocket tester to the real backend** (highest credibility-per-hour).
3. Add `Skeleton`, `EmptyState`, `ErrorState` primitives.
4. Apply loading + empty states to **Dashboard** and **Telemetry**.
5. Raise muted text color for AA contrast; add `prefers-reduced-motion` guard.

### Phase 2 — Major UX (1 week)
1. One `<TelemetryChart>` primitive with axis units + **cross-channel cursor sync**.
2. Real **key management** in Developer Portal: list, usage, revoke (add `GET /keys`, `DELETE /keys/{id}`).
3. Docs skeleton: quickstart, REST reference, WS reference, auth, rate limits.
4. Error boundaries on every data page.
5. Dashboard standings → full 20-driver grid with `layout` re-sort animation.

### Phase 3 — Series-A quality (2–4 weeks)
1. Full docs site with runnable examples + SDK pages.
2. Auth + Settings.
3. Replay performance rework: incremental canvas redraw / offscreen canvas; buffering + import-pending states.
4. Stripe-grade empty/error/loading everywhere.
5. Live status page with real latency/uptime (real trust signal for the landing page).

---

## Part 6 — Going live with real data (operational)

Independent of the design work, the path to real data:
1. Provision Postgres + Redis (Railway one-click).
2. Set `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS` in backend env.
3. Run the importer: `python -m app.services.importer --season 2025 --race Monaco --session Race`.
4. Deploy backend (Railway) + frontend (Vercel).
5. Generate a real key via `POST /keys`; confirm `/telemetry?...` returns `"source": "db"`.

---

## Security note
A Google API key was shared in plaintext while setting up the Stitch MCP connector. Treat it as compromised: rotate it in the Google Cloud console and store the replacement in an environment variable rather than inline in commands.

---

## Recommended first move
Phase 1, items 2 and 4 together: wire the Playground to the real WebSocket and add real loading/empty states to the Dashboard. Those two changes do more to make RaceCast feel like real infrastructure than any visual restyle, and they're low-risk because the backend already supports them.
