'use client'
import Link from 'next/link'

const PERSONAS = [
  { icon: '◈', label: 'AI ENGINEERS' },
  { icon: '◎', label: 'ANALYSTS' },
  { icon: '⌗', label: 'DEVELOPERS' },
  { icon: '⚗', label: 'RESEARCH TEAMS' },
]

const LEADERBOARD = [
  { pos: 1, code: 'VER', gap: '—' },
  { pos: 2, code: 'LEC', gap: '+0.4s' },
  { pos: 3, code: 'NOR', gap: '+1.2s' },
  { pos: 4, code: 'PIA', gap: '+1.8s' },
  { pos: 5, code: 'HAM', gap: '+5.1s' },
]

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#090909] text-white overflow-x-hidden">
      <nav className="border-b border-[#1C1C1C]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="font-bold text-xl tracking-tight">
              <span className="text-white">Race</span><span className="text-[#FF5A1F]">Cast</span>
            </div>
            <div className="hidden md:flex items-center gap-7 text-sm">
              <span className="text-[#FF5A1F]">Platform</span>
              <Link href="/overview" className="text-[#9A9AA5] hover:text-white transition-colors">Solutions</Link>
              <Link href="/developer" className="text-[#9A9AA5] hover:text-white transition-colors">Developers</Link>
              <Link href="/docs" className="text-[#9A9AA5] hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/overview" className="text-sm text-[#9A9AA5] hover:text-white transition-colors">Sign In</Link>
            <Link href="/overview" className="px-4 py-2 bg-[#FF5A1F] hover:bg-orange-500 rounded-lg text-sm font-semibold transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="relative border-b border-[#1C1C1C]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Replay Formula 1<br />Like It's<br />Happening Live.
            </h1>
            <p className="text-[#9A9AA5] text-lg leading-relaxed mb-8 max-w-md">
              Historical race replay, telemetry streaming, and developer APIs built for engineers. Re-experience every second of the Grand Prix with sub-millisecond precision.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/overview" className="px-6 py-3 bg-[#FF5A1F] hover:bg-orange-500 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">Get API Access ⌗</Link>
              <Link href="/replay" className="px-6 py-3 border border-[#262626] hover:border-white/40 rounded-xl text-sm font-semibold transition-colors">Watch Demo</Link>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-xs font-mono text-[#FF5A1F]"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]" /> LIVE REPLAY</span>
              <span className="text-xs font-mono text-[#5A5A62]">Monaco GP 2025</span>
              <span className="text-xs font-mono text-[#FF5A1F]">Speed 6x</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-[#5A5A62] mb-2">LEADERBOARD</div>
                {LEADERBOARD.map(d => (
                  <div key={d.pos} className="flex items-center gap-2 py-1.5 border-b border-[#1C1C1C] last:border-0">
                    <span className="font-mono text-xs text-[#5A5A62] w-3">{d.pos}</span>
                    <span className="font-mono text-sm font-bold">{d.code}</span>
                    <span className="font-mono text-xs text-[#9A9AA5] ml-auto">{d.gap}</span>
                  </div>
                ))}
              </div>
              <div className="relative rounded-lg bg-[#0a0a0a] border border-[#1C1C1C] flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 200 160" className="w-full h-full p-3" fill="none" stroke="#FF5A1F" strokeWidth="2" opacity="0.5">
                  <path d="M40 120 Q30 90 50 70 Q60 55 50 40 Q45 25 65 25 Q90 25 95 45 Q100 65 120 60 Q145 55 150 75 Q155 95 135 105 Q110 115 115 130 Q118 140 100 138 Q70 135 60 125 Q50 122 40 120 Z" strokeLinejoin="round" />
                </svg>
                <span className="absolute bottom-2 text-[10px] font-mono text-[#EAB308]">⚠ SAFETY CAR ACTIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#1C1C1C]">
              <span className="font-mono text-xs text-[#9A9AA5]">LAP 61/78</span>
              <div className="flex-1 h-1 bg-[#1C1C1C] rounded-full overflow-hidden"><div className="h-full w-[78%] bg-[#FF5A1F] rounded-full" /></div>
              <span className="font-mono text-[10px] text-[#5A5A62]">EVENT_STREAM: OVERTAKE_L61_P3</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-xs font-mono tracking-[0.2em] text-[#FF5A1F] mb-3">CORE ENGINE</div>
        <h2 className="text-3xl font-bold mb-10">Millisecond Replay Precision.</h2>
        <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-8">
          <div className="relative flex items-center justify-between mb-8">
            <div className="absolute left-0 right-0 top-2 h-px bg-[#1C1C1C]" />
            {[
              { lap: 'LAP 1', icon: '⚑', color: '#9A9AA5' },
              { lap: 'LAP 25', icon: '⚠', color: '#EAB308' },
              { lap: 'LAP 50', icon: '◉', color: '#3B82F6' },
              { lap: '', icon: '●', color: '#FF5A1F' },
              { lap: 'LAP 78', icon: '✓', color: '#22C55E' },
            ].map((m, i) => (
              <div key={i} className="relative flex flex-col items-center gap-2">
                <span style={{ color: m.color }} className="text-sm bg-[#0d0d0d] px-1">{m.icon}</span>
                {m.lap && <span className="text-xs font-mono text-[#5A5A62]">{m.lap}</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg border border-[#1C1C1C] flex items-center justify-center text-[#9A9AA5]">⏮</button>
              <button className="w-9 h-9 rounded-lg bg-[#FF5A1F] flex items-center justify-center">▶</button>
              <button className="w-9 h-9 rounded-lg border border-[#1C1C1C] flex items-center justify-center text-[#9A9AA5]">⏭</button>
            </div>
            <div className="flex gap-1 ml-4">
              {['1x', '2x', '6x', '10x'].map((s, i) => (
                <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-mono ${i === 2 ? 'bg-[#FF5A1F] text-white' : 'border border-[#1C1C1C] text-[#9A9AA5]'}`}>{s}</span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs font-mono text-[#5A5A62]">Jump to Lap: <span className="px-3 py-1.5 border border-[#1C1C1C] rounded-lg text-white">61</span></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#5A5A62]">SPEED (KM/H)</span>
            <span className="font-mono text-lg font-bold text-[#FF5A1F]">312</span>
          </div>
          <div className="h-20 mb-4 flex items-end gap-0.5">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="flex-1 bg-[#FF5A1F]/30 rounded-t" style={{ height: `${30 + 60 * Math.abs(Math.sin(i * 0.3))}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs font-mono text-[#5A5A62] mb-1">THROTTLE</div>
              <div className="h-2 bg-[#1C1C1C] rounded-full overflow-hidden"><div className="h-full w-[92%] bg-[#22C55E] rounded-full" /></div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#5A5A62] mb-1">BRAKE</div>
              <div className="h-2 bg-[#1C1C1C] rounded-full overflow-hidden"><div className="h-full w-[12%] bg-[#FF5A1F] rounded-full" /></div>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-3 border-t border-[#1C1C1C]">
            <div><span className="text-2xl font-bold">8</span><span className="text-xs font-mono text-[#5A5A62] ml-2">GEAR</span></div>
            <div><span className="text-2xl font-bold">11,400</span><span className="text-xs font-mono text-[#5A5A62] ml-2">RPM</span></div>
            <div className="ml-auto font-mono text-sm font-bold text-[#FF5A1F] text-right">DRS<br /><span className="text-xs">ACTIVE</span></div>
          </div>
        </div>
        <div>
          <div className="text-xs font-mono tracking-[0.2em] text-[#FF5A1F] mb-3">DATA FIDELITY</div>
          <h2 className="text-3xl font-bold mb-4">Real-time Telemetry Traces.</h2>
          <p className="text-[#9A9AA5] leading-relaxed max-w-md">Access every sensor on the car. Speed, throttle position, gear selection, and brake pressure are streamed via ultra-low latency WebSocket connections.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Developer-First Infrastructure.</h2>
        <p className="text-[#9A9AA5] mb-12 max-w-xl mx-auto">Built by engineers, for engineers. Our APIs are designed to be intuitive, reliable, and ridiculously fast.</p>
        <div className="grid md:grid-cols-3 gap-5 text-left">
          {[
            { icon: '◈', title: 'REST API', desc: 'Fetch historical race data, lap times, and driver standings with our robust REST endpoints.', code: 'GET /v2/race/monaco/telemetry' },
            { icon: '⣿', title: 'WebSocket Streaming', desc: 'Direct binary stream for live telemetry with <2ms overhead. Perfect for real-time dashboards.', code: 'wss://api/v2/live/{VER}' },
            { icon: '⌗', title: 'SDKs', desc: 'First-class support for Python, JavaScript, and Rust. Integrate in minutes, not days.', code: 'import racecast' },
          ].map(c => (
            <div key={c.title} className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6">
              <div className="text-[#FF5A1F] text-xl mb-4">{c.icon}</div>
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-[#9A9AA5] mb-4 leading-relaxed">{c.desc}</p>
              <code className="block bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg px-3 py-2 text-xs font-mono text-[#9A9AA5] truncate">{c.code}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 text-center border-t border-[#1C1C1C]">
        <div className="text-xs font-mono tracking-[0.3em] text-[#5A5A62] mb-8">BUILT FOR THE ELITE</div>
        <div className="flex items-center justify-center gap-16 flex-wrap">
          {PERSONAS.map(p => (
            <div key={p.label} className="flex flex-col items-center gap-2">
              <span className="text-[#FF5A1F] text-2xl">{p.icon}</span>
              <span className="text-xs font-mono text-[#9A9AA5]">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#FF5A1F] py-20 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Build on Formula 1 Data.</h2>
        <Link href="/overview" className="inline-block px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-[#111] transition-colors">Get Started Now</Link>
      </section>

      <footer className="border-t border-[#1C1C1C] py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-[#5A5A62] flex-wrap gap-4">
          <span className="flex items-center gap-2">
            <span className="font-bold"><span className="text-white">Race</span><span className="text-[#FF5A1F]">Cast</span></span>
            <span className="flex items-center gap-1.5 ml-2"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> © 2025 RaceCast Infrastructure. All systems operational.</span>
          </span>
          <div className="flex gap-5">
            {['Status', 'Privacy', 'Terms', 'Security', 'GitHub'].map(l => (
              <span key={l} className="hover:text-white cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
