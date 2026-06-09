'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/States'
import { api, type RateStatus } from '@/lib/api'

function Bar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-[#9A9AA5]">{label}</span>
        <span className="text-sm font-mono">{fmt(used)} / {fmt(total)}</span>
      </div>
      <div className="h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Developer() {
  const [rate, setRate] = useState<RateStatus | null>(null)
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState(true)

  const prodKey = 'pk_racecast_live_72948' + (reveal ? 'a3f9b2c1d4e5f6a7b8c9' : '…')
  const sandboxKey = 'sk_racecast_test_10294' + (reveal ? 'e1f2a3b4c5d6e7f8a9b0' : '…')

  useEffect(() => {
    api.rateStatus().then(setRate).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const usageBars = Array.from({ length: 28 }, (_, i) => 30 + 50 * Math.abs(Math.sin(i * 0.6)) + (i % 5) * 6)

  return (
    <AppShell breadcrumb={['Infrastructure', 'Developer Portal']}>
      <div className="px-8 py-8 max-w-[1400px]">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[44px] font-bold tracking-tight leading-none">Developer Console</h1>
            <p className="text-[#9A9AA5] mt-3 text-lg">Manage F1 real-time telemetry streams and developer resources.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded-xl border border-[#1C1C1C] text-sm font-medium hover:border-white/30 transition-colors">View API Logs</button>
            <button className="px-4 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-orange-500 text-sm font-semibold transition-colors">+ Create App</button>
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-6 mb-6">
          <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[#FF5A1F]">⚷</span>
                <h2 className="text-xl font-semibold">API Keys</h2>
              </div>
              <button onClick={() => setReveal(r => !r)} className="text-sm text-[#FF5A1F] hover:underline">
                {reveal ? 'Hide All' : 'Reveal All'}
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'PRODUCTION KEY', value: prodKey },
                { label: 'SANDBOX KEY', value: sandboxKey },
              ].map(k => (
                <div key={k.label} className="flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#1C1C1C] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-1.5">{k.label}</div>
                    <div className="font-mono text-sm truncate">{k.value}</div>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(k.value)}
                    className="text-[#9A9AA5] hover:text-white p-1" title="Copy">⧉</button>
                  <button className="text-[#FF5A1F] hover:text-orange-400 p-1" title="Rotate">↻</button>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-4 text-sm text-[#5A5A62]">
              <span className="mt-0.5">ⓘ</span>
              <span>Keys created 12 days ago. It is recommended to rotate production keys every 90 days.</span>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Rate Limits</h2>
            {loading ? (
              <div className="space-y-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ height: 40 }} />)}</div>
            ) : (
              <div className="space-y-5">
                <Bar
                  label="Requests / min"
                  used={rate && typeof rate.used_this_minute === 'number' ? rate.used_this_minute : 0}
                  total={rate && typeof rate.limit_per_minute === 'number' ? rate.limit_per_minute : 100}
                  color="#FF5A1F"
                />
                <Bar label="WebSocket Messages / min" used={42} total={120} color="#FF5A1F" />
                <Bar label="Burst Capacity" used={6100} total={10000} color="#22C55E" />
                <div className="text-xs text-[#5A5A62] pt-1">
                  Tier: <span className="text-white font-mono">{rate?.tier ?? 'default'}</span> · live from rate limiter
                </div>
              </div>
            )}
            <button className="w-full mt-6 py-2.5 rounded-xl border border-[#1C1C1C] text-sm hover:border-white/30 transition-colors">
              Request Limit Increase
            </button>
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Usage Analytics</h2>
              <div className="flex gap-1 p-1 bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg">
                {['24h', '7d', '30d'].map((t, i) => (
                  <button key={t} className={`px-3 py-1 rounded text-xs font-mono ${i === 1 ? 'bg-[#161616] text-white' : 'text-[#5A5A62]'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-8">
              {[
                { label: 'AVG LATENCY', value: '14ms', color: '#FF5A1F' },
                { label: 'THROUGHPUT', value: '1.2GB/hr', color: '#FFFFFF' },
                { label: 'ERROR RATE', value: '0.02%', color: '#22C55E' },
              ].map(m => (
                <div key={m.label} className="text-right">
                  <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-1">{m.label}</div>
                  <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-40">
            {usageBars.map((h, i) => (
              <div key={i} className="flex-1 bg-[#1C1C1C] rounded-t hover:bg-[#262626] transition-colors" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
