'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api, type LeaderboardRow, type RaceEvent } from '@/lib/api'
import { tireColor, teamColor } from '@/lib/tokens'

const ACTIVE_SESSION_ID = 1
const TOTAL_LAPS = 78

const TEAM_OF: Record<string, string> = {
  VER: 'Red Bull Racing', LEC: 'Ferrari', SAI: 'Ferrari', HAM: 'Ferrari',
  RUS: 'Mercedes', ANT: 'Mercedes', NOR: 'McLaren', PIA: 'McLaren', ALO: 'Aston Martin',
}

const DEMO_STANDINGS: LeaderboardRow[] = [
  { driver_code: 'VER', lap_number: 42, lap_time_ms: 74593, position: 1, compound: 'M' },
  { driver_code: 'LEC', lap_number: 42, lap_time_ms: 75102, position: 2, compound: 'S' },
  { driver_code: 'RUS', lap_number: 42, lap_time_ms: 74992, position: 3, compound: 'M' },
  { driver_code: 'NOR', lap_number: 42, lap_time_ms: 75221, position: 4, compound: 'M' },
  { driver_code: 'SAI', lap_number: 42, lap_time_ms: 75005, position: 5, compound: 'H' },
]
const DEMO_EVENTS: RaceEvent[] = [
  { lap: 42, event_type: 'SAFETY_CAR', description: 'Safety Car deployed. Incident involving PER at Turn 1. Speed restricted to delta.' },
  { lap: 40, event_type: 'OVERTAKE', description: 'LEC overtook RUS for P2 at the exit of Tunnel.' },
  { lap: 39, event_type: 'PIT_STOP', description: 'SAI pitted. Stationary for 2.4s. Fitted Hard Tyres.' },
  { lap: 38, event_type: 'YELLOW_FLAG', description: 'Yellow Flag in Sector 1. Caution required at Sainte-Devote.' },
  { lap: 40, event_type: 'FASTEST_LAP', description: 'VER set fastest lap: 1:14.593.' },
]

function StatusInline({ label }: { label: string }) {
  return <span className="flex items-center gap-1.5 text-[#22C55E]"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />{label}</span>
}

export default function Replay() {
  const [standings, setStandings] = useState<LeaderboardRow[]>([])
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [lap, setLap] = useState(42)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    Promise.all([api.getLeaderboard(ACTIVE_SESSION_ID), api.getEvents(ACTIVE_SESSION_ID)])
      .then(([lb, ev]) => { setStandings(lb.standings || []); setEvents(ev.events || []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setLap(l => l >= TOTAL_LAPS ? TOTAL_LAPS : l + 1), 1000 / speed)
    return () => clearInterval(id)
  }, [playing, speed])

  const fmtLap = (ms: number) => {
    const s = ms / 1000
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`
  }

  const rows = standings.length ? standings : DEMO_STANDINGS
  const feed = events.length ? events : DEMO_EVENTS

  return (
    <AppShell breadcrumb={['Infrastructure', 'Replay']}>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Session archive */}
        <div className="w-64 shrink-0 border-r border-[#1C1C1C] p-5 overflow-y-auto">
          <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-4">SESSION ARCHIVE</div>
          <label className="block text-sm text-[#9A9AA5] mb-2">Season</label>
          <select className="w-full bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg px-3 py-2 text-sm mb-4 outline-none">
            <option>2025</option><option>2024</option>
          </select>
          <label className="block text-sm text-[#9A9AA5] mb-2">Grand Prix</label>
          <select className="w-full bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg px-3 py-2 text-sm mb-6 outline-none">
            <option>Monaco GP</option><option>British GP</option><option>Italian GP</option>
          </select>
          <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-3">SESSIONS</div>
          {[
            { name: 'Free Practice 1', sub: '60:00 Duration', active: false },
            { name: 'Race (Main)', sub: `Lap ${TOTAL_LAPS}/${TOTAL_LAPS}`, active: true },
            { name: 'Qualifying', sub: 'Q1, Q2, Q3', active: false },
          ].map(s => (
            <div key={s.name} className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${s.active ? 'bg-[#FF5A1F]/10 border border-[#FF5A1F]/30' : 'hover:bg-[#111111]'}`}>
              <div className={`text-sm font-medium ${s.active ? 'text-[#FF5A1F]' : ''}`}>{s.name}</div>
              <div className="text-xs text-[#5A5A62] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1C1C1C]">
            <div>
              <div className="text-xs text-[#5A5A62] font-mono">CURRENT LAP</div>
              <div className="text-2xl font-bold"><span className="text-[#FF5A1F]">{lap}</span><span className="text-[#5A5A62] text-base">/{TOTAL_LAPS}</span></div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setLap(l => Math.max(1, l - 1))} className="w-9 h-9 rounded-lg border border-[#1C1C1C] hover:border-white/30 flex items-center justify-center">⏮</button>
              <button onClick={() => setPlaying(p => !p)} className="w-11 h-11 rounded-xl bg-[#FF5A1F] hover:bg-orange-500 flex items-center justify-center text-lg">{playing ? '⏸' : '▶'}</button>
              <button onClick={() => setLap(l => Math.min(TOTAL_LAPS, l + 1))} className="w-9 h-9 rounded-lg border border-[#1C1C1C] hover:border-white/30 flex items-center justify-center">⏭</button>
            </div>
            <div className="flex gap-1 ml-2">
              {[0.5, 1, 2, 10].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-3 py-1.5 rounded-lg text-xs font-mono ${speed === s ? 'bg-[#FF5A1F] text-white' : 'border border-[#1C1C1C] text-[#9A9AA5]'}`}>{s}x</button>
              ))}
            </div>
          </div>

          <div className="relative mx-6 mt-4 h-48 rounded-xl bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a] border border-[#1C1C1C] overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#262626] text-xs font-mono flex items-center gap-2">⚠ ACCIDENT: PER</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#FF5A1F]/30 text-xs font-mono text-[#FF5A1F] flex items-center gap-2">⏱ FASTEST LAP: VER</div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[80%]">
              <input type="range" min={1} max={TOTAL_LAPS} value={lap} onChange={e => setLap(+e.target.value)} className="w-full" style={{ accentColor: '#FF5A1F' }} />
              <div className="text-center text-xs font-mono text-[#9A9AA5] mt-1">LAP {lap} / 01:12:45</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-[1.5fr_1fr] gap-4">
            <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1C1C1C] flex items-center gap-2">
                <span className="text-[#FF5A1F]">≡</span>
                <h3 className="font-semibold text-sm">LIVE CLASSIFICATION</h3>
                <div className="ml-auto flex gap-6 text-xs font-mono text-[#5A5A62]"><span>INTERVAL</span><span>LAST LAP</span><span>TYRE</span></div>
              </div>
              <div>
                {rows.slice(0, 6).map((d, i) => {
                  const team = TEAM_OF[d.driver_code] ?? ''
                  const tc = teamColor[team] ?? '#9A9AA5'
                  const compound = (d.compound ?? 'M')[0]
                  return (
                    <div key={d.driver_code} className="flex items-center gap-3 px-4 py-3 border-b border-[#1C1C1C] last:border-0 hover:bg-[#111111] transition-colors">
                      <span className="font-mono text-sm text-[#5A5A62] w-4">{i + 1}</span>
                      <div className="w-1 h-8 rounded-full" style={{ background: tc }} />
                      <div className="w-20"><div className="font-mono font-bold text-sm">{d.driver_code}</div><div className="text-xs text-[#5A5A62]">{team.split(' ')[0]}</div></div>
                      <div className="w-16 font-mono text-sm" style={{ color: i === 0 ? '#FF5A1F' : '#9A9AA5' }}>{i === 0 ? 'LEADER' : `+${(i * 3.4 + 0.5).toFixed(3)}`}</div>
                      <div className="flex-1 font-mono text-sm">{fmtLap(d.lap_time_ms || (74593 + i * 400))}</div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: tireColor[compound], borderColor: `${tireColor[compound]}40` }}>{compound}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl p-4">
                <h3 className="text-xs font-mono tracking-widest text-[#9A9AA5] mb-4">TIRE DEGRADATION MODEL</h3>
                <div className="flex items-end gap-3 h-28">
                  {[{ l: 'FL', h: 90 }, { l: 'FR', h: 78 }, { l: 'RL', h: 62 }, { l: 'RR', h: 40 }].map(b => (
                    <div key={b.l} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full rounded-t bg-gradient-to-t from-[#7a2410] to-[#FF5A1F]" style={{ height: `${b.h}%` }} />
                      <span className="text-xs font-mono text-[#5A5A62]">{b.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl p-4">
                <h3 className="text-xs font-mono tracking-widest text-[#9A9AA5] mb-3">TRACK MAP NODE STATUS</h3>
                <div className="h-20 rounded-lg bg-[#0a0a0a] border border-[#1C1C1C] flex items-center justify-center text-[#FF5A1F] text-2xl mb-3">∿</div>
                <div className="flex items-center justify-between text-xs font-mono"><StatusInline label="ALL NODES UP" /><span className="text-[#22C55E]">0.02ms LATENCY</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Race control */}
        <div className="w-80 shrink-0 border-l border-[#1C1C1C] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C] flex items-center justify-between">
            <h3 className="font-semibold text-sm tracking-wide">RACE CONTROL</h3>
            <span className="text-xs font-mono px-2 py-1 rounded border border-[#1C1C1C] text-[#9A9AA5]">LIVE FEED</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {feed.slice().reverse().map((e, i) => {
              const isYellow = e.event_type.includes('YELLOW')
              return (
                <div key={i} className={`p-3 rounded-xl border ${isYellow ? 'bg-[#EAB308]/5 border-[#EAB308]/30' : 'bg-[#0d0d0d] border-[#1C1C1C]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-mono font-bold ${isYellow ? 'text-[#EAB308]' : 'text-[#FF5A1F]'}`}>{e.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-mono text-[#5A5A62]">LAP {e.lap}</span>
                  </div>
                  <div className="text-xs text-[#9A9AA5] leading-relaxed">{e.description}</div>
                </div>
              )
            })}
          </div>
          <div className="p-4 border-t border-[#1C1C1C]">
            <button className="w-full py-2.5 rounded-xl border border-[#1C1C1C] text-sm hover:border-white/30 transition-colors flex items-center justify-center gap-2">↓ Export Session Log</button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
