/**
 * RaceCast API client.
 * All backend calls go through here so components stay state-driven.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.message || body.detail || detail
    } catch {}
    throw new ApiError(detail, res.status)
  }
  return res.json()
}

export const api = {
  // Races
  listRaces: (season = 2025) => req<RacesResponse>(`/races/?season=${season}`),
  getRace: (id: number) => req<Race>(`/races/${id}`),

  // Drivers
  listDrivers: (season = 2025) => req<DriversResponse>(`/drivers/?season=${season}`),

  // Sessions
  listSessions: (raceId: number) => req<Session[]>(`/sessions/?race_id=${raceId}`),

  // Telemetry
  getTelemetry: (sessionId: number, driver: string, opts?: { lap?: number; channels?: string; downsample?: number }) => {
    const p = new URLSearchParams({ session_id: String(sessionId), driver })
    if (opts?.lap) p.set('lap', String(opts.lap))
    if (opts?.channels) p.set('channels', opts.channels)
    if (opts?.downsample) p.set('downsample', String(opts.downsample))
    return req<TelemetryResponse>(`/telemetry/?${p}`)
  },
  compareTelemetry: (sessionId: number, a: string, b: string, lap?: number) => {
    const p = new URLSearchParams({ session_id: String(sessionId), driver_a: a, driver_b: b })
    if (lap) p.set('lap', String(lap))
    return req<CompareResponse>(`/telemetry/compare?${p}`)
  },
  getLeaderboard: (sessionId: number) => req<LeaderboardResponse>(`/telemetry/leaderboard?session_id=${sessionId}`),

  // Events / weather
  getEvents: (sessionId: number, driver?: string) =>
    req<EventsResponse>(`/events/?session_id=${sessionId}${driver ? `&driver=${driver}` : ''}`),
  getWeather: (sessionId: number) => req<WeatherResponse>(`/weather/?session_id=${sessionId}`),

  // Keys
  createKey: (body: { name: string; email: string; tier: string }) =>
    req<CreatedKey>('/keys/', { method: 'POST', body: JSON.stringify(body) }),
  listKeys: (email: string) => req<KeyListResponse>(`/keys/?email=${encodeURIComponent(email)}`),
  revokeKey: (id: number) => req<{ revoked: number }>(`/keys/${id}`, { method: 'DELETE' }),
  keyUsage: (id: number) => req<KeyUsage>(`/keys/${id}/usage`),
  listTiers: () => req<Tier[]>('/keys/tiers'),

  // Platform stats
  platformStats: () => req<PlatformStats>('/stats/platform'),
  recentSessions: () => req<RecentSessions>('/stats/recent-sessions'),

  // Cache / rate
  cacheStats: () => req<CacheStats>('/cache/stats'),
  rateStatus: () => req<RateStatus>('/rate-limit/status'),

  wsUrl: () => `${WS}/ws/stream`,
}

// ── Types ──────────────────────────────────────────────────────────
export interface Race { id: number; season: number; round: number; name: string; circuit: string; country?: string; date?: string }
export interface RacesResponse { season: number; count: number; races: Race[] }
export interface Driver { code: string; number: number; first_name: string; last_name: string; team: string; team_color: string }
export interface DriversResponse { season: number; count: number; drivers: Driver[] }
export interface Session { id: number; race_id: number; session_type: string; imported: boolean }
export interface TelemetryFrame { time_ms: number; speed?: number; throttle?: number; brake?: number; rpm?: number; gear?: number; drs?: number }
export interface TelemetryResponse { session_id: number; driver: string; lap?: number; frames: number; data: TelemetryFrame[]; source?: string }
export interface CompareResponse { session_id: number; lap?: number; driver_a: { code: string; data: TelemetryFrame[] }; driver_b: { code: string; data: TelemetryFrame[] } }
export interface LeaderboardRow { driver_code: string; lap_number: number; lap_time_ms: number; position: number; compound?: string; tyre_life?: number }
export interface LeaderboardResponse { session_id: number; count: number; standings: LeaderboardRow[] }
export interface RaceEvent { lap: number; event_type: string; description: string; driver_code?: string }
export interface EventsResponse { session_id: number; count: number; events: RaceEvent[] }
export interface WeatherFrame { lap: number; air_temp: number; track_temp: number; humidity: number; wind_speed: number; rainfall: number }
export interface WeatherResponse { session_id: number; frames: WeatherFrame[] }
export interface CreatedKey { key: string; name: string; email: string; tier: string; rate_limit_per_month: number; message: string }
export interface KeyListItem { id: number; name: string; tier: string; key_preview: string; active: boolean; created_at?: string }
export interface KeyListResponse { count: number; keys: KeyListItem[] }
export interface KeyUsage { key_id: number; tier: string; used_this_month: number; limit: number | string; remaining: number | string }
export interface Tier { tier: string; price: number | null; requests_per_month: number; ws_connections: number; features: string[] }
export interface PlatformStats {
  real: { races_indexed: number; sessions_total: number; sessions_imported: number; laps_recorded: number; telemetry_records: number; api_requests_month: number }
  illustrative: { active_regions: number; primary_node: string; node_jitter_ms: number; cpu_load_pct: number; throughput: string; note: string }
}
export interface RecentSessionRow { name: string; circuit: string; status: string; telemetry_rows: number; data_size_gb: number }
export interface RecentSessions { count: number; sessions: RecentSessionRow[] }
export interface CacheStats { l1: { size: number; hits: number; misses: number; hit_rate: number }; l2_redis: { connected: boolean } }
export interface RateStatus { tier: string; limit_per_minute: number | string; used_this_minute: number; remaining_this_minute: number | string }
