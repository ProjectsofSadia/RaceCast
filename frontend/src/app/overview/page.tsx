'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Skeleton, SkeletonRows, ErrorState, StatusDot } from '@/components/ui/States'
import { api, type PlatformStats, type RecentSessions } from '@/lib/api'

function fmtBig(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return String(n)
}

const STATUS_STYLE: Record<string, string> = {
  ARCHIVED:   'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10',
  PROCESSING: 'text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/10',
  LIVE:       'text-[#FF5A1F] border-[#FF5A1F]/30 bg-[#FF5A1F]/10',
}

export default function Overview() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [recent, setRecent] = useState<RecentSessions | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err, setErr] = useState('')

  const load = async () => {
    setState('loading')
    try {
      const [s, r] = await Promise.all([api.platformStats(), api.recentSessions()])
      setStats(s); setRecent(r); setState('ready')
    } catch (e: any) {
      setErr(e.message || 'Failed to load platform stats'); setState('error')
    }
  }
  useEffect(() => { load() }, [])

  const cards = stats ? [
    { label: 'RACES INDEXED',     value: String(stats.real.races_indexed),        sub: `${stats.real.sessions_imported} sessions imported`, accent: false },
    { label: 'TELEMETRY RECORDS', value: fmtBig(stats.real.telemetry_records),    sub: 'pts', accent: false },
    { label: 'LAPS RECORDED',     value: fmtBig(stats.real.laps_recorded),        sub: 'real laps', accent: false },
    { label: 'API REQUESTS / MO', value: fmtBig(stats.real.api_requests_month),   sub: 'this month', accent: true },
  ] : []

  return (
    <AppShell breadcrumb={['Infrastructure', 'Overview']}>
      <div className="px-8 py-8 max-w-[1400px]">
        {/* Heading */}
        <div className="mb-8">
          <StatusDot status="online" label="GLOBAL SYSTEMS OPERATIONAL" />
          <h1 className="text-[44px] font-bold tracking-tight mt-2 leading-none">Platform Infrastructure</h1>
          <p className="text-[#9A9AA5] mt-3 text-lg max-w-2xl">
            High-performance telemetry ingestion and replay orchestration for the FIA Formula One World Championship.
          </p>
        </div>

        {state === 'error' && <ErrorState message={err} onRetry={load} />}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {state === 'loading'
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 120 }} />)
            : cards.map(c => (
              <div key={c.label} className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl p-6">
                <div className="text-xs font-mono tracking-widest text-[#9A9AA5] mb-4">{c.label}</div>
                <div className="text-[40px] font-bold leading-none mb-1">
                  {c.value}<span className="text-base text-[#5A5A62] font-normal ml-1">{c.accent ? '' : ''}</span>
                </div>
                <div className={`text-xs ${c.accent ? 'text-[#FF5A1F]' : 'text-[#5A5A62]'}`}>{c.sub}</div>
              </div>
            ))}
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-8">
          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Sessions</h2>
              <a href="/replay" className="text-xs font-mono tracking-widest text-[#FF5A1F] hover:underline">VIEW ALL SESSIONS</a>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl overflow-hidden">
              {state === 'loading' ? (
                <div className="p-5"><SkeletonRows rows={4} height={56} /></div>
              ) : recent && recent.sessions.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1C1C1C]">
                      {['GRAND PRIX', 'STATUS', 'DATA SIZE', 'TELEMETRY'].map(h => (
                        <th key={h} scope="col" className="px-5 py-3 text-left text-xs font-mono tracking-widest text-[#9A9AA5] font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.sessions.map((s, i) => (
                      <tr key={i} className="border-b border-[#1C1C1C] last:border-0 hover:bg-[#111111] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-[#5A5A62] mt-0.5">{s.circuit}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.PROCESSING}`}>{s.status}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm">{s.data_size_gb} GB</td>
                        <td className="px-5 py-4 font-mono text-sm text-[#9A9AA5]">{fmtBig(s.telemetry_rows)} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-sm text-[#5A5A62]">
                  No sessions imported yet. Run the importer to populate real F1 data.
                </div>
              )}
            </div>
          </div>

          {/* Global nodes (illustrative) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Global Nodes</h2>
              {stats && <span className="text-xs font-mono text-[#5A5A62]">{stats.illustrative.active_regions} Active Regions</span>}
            </div>
            <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl overflow-hidden">
              {/* "world map" panel */}
              <div className="relative h-44 bg-gradient-to-br from-[#111111] to-[#0a0a0a] overflow-hidden">
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,90,31,0.15), transparent 40%), radial-gradient(circle at 70% 60%, rgba(34,197,94,0.1), transparent 35%)' }} />
                <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <circle key={i} cx={`${(i * 53) % 100}%`} cy={`${(i * 37) % 100}%`} r="1" fill="#9A9AA5" />
                  ))}
                </svg>
                {state === 'ready' && stats && (
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-[#161616] border border-[#262626] rounded px-2 py-0.5">NODE_EU_WEST_1</span>
                      <span className="text-xs font-mono text-[#22C55E]">{stats.illustrative.node_jitter_ms}ms JITTER</span>
                    </div>
                    <div className="text-lg font-semibold">Frankfurt Hub</div>
                  </div>
                )}
              </div>
              {state === 'ready' && stats && (
                <div className="grid grid-cols-2 divide-x divide-[#1C1C1C] border-t border-[#1C1C1C]">
                  <div className="p-4">
                    <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-1">CPU LOAD</div>
                    <div className="text-lg font-semibold">{stats.illustrative.cpu_load_pct}%</div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-1">THROUGHPUT</div>
                    <div className="text-lg font-semibold">{stats.illustrative.throughput}</div>
                  </div>
                </div>
              )}
            </div>
            {stats && (
              <p className="text-[11px] text-[#5A5A62] mt-2 leading-relaxed">{stats.illustrative.note}</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
