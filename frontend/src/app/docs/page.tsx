'use client'
import AppShell from '@/components/layout/AppShell'

const ON_THIS_PAGE = ['Introduction', 'Authentication', 'Streaming Data Types', 'JSON Payload Schema']

const STREAM_TYPES = [
  { icon: '⣿', title: 'Standard Stream (10Hz)', desc: 'Basic car metrics: Speed, Gear, RPM, Brake Pressure.' },
  { icon: '⦿', title: 'Engineering Stream (100Hz)', desc: 'High-resolution sensor data including tire temperature gradients and G-force vectors.' },
  { icon: '◧', title: 'Predicted Stream', desc: 'AI-driven predictions for pit window strategies and tire degradation.' },
]

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Docs() {
  return (
    <AppShell breadcrumb={['Documentation', 'Telemetry API']}>
      <div className="flex max-w-[1400px]">
        {/* Main content */}
        <div className="flex-1 min-w-0 px-10 py-10">
          <div className="text-xs font-mono text-[#5A5A62] mb-3">Documentation / Telemetry API</div>
          <h1 className="text-[40px] font-bold tracking-tight mb-5">Telemetry Streams</h1>
          <p className="text-[#9A9AA5] text-base leading-relaxed max-w-2xl mb-8">
            The RaceCast Telemetry API provides real-time, high-frequency data streams from Formula 1 power units,
            chassis sensors, and trackside timing loops. Our infrastructure is designed for sub-50ms latency,
            enabling high-performance analysis and race strategy automation.
          </p>

          {/* Quick start / API ref cards */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <a href="/playground" className="block p-6 bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl hover:border-[#FF5A1F]/40 transition-colors">
              <div className="text-[#FF5A1F] text-xl mb-3">⚡</div>
              <div className="font-semibold mb-1">Quick Start</div>
              <div className="text-sm text-[#9A9AA5]">Get connected to our websocket feed in under 5 minutes.</div>
            </a>
            <a href="#schema" className="block p-6 bg-[#0d0d0d] border border-[#1C1C1C] rounded-xl hover:border-[#FF5A1F]/40 transition-colors">
              <div className="text-[#FF5A1F] text-xl mb-3">▤</div>
              <div className="font-semibold mb-1">API Reference</div>
              <div className="text-sm text-[#9A9AA5]">Detailed schemas for every race data point and event type.</div>
            </a>
          </div>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
            <p className="text-[#9A9AA5] mb-4 max-w-2xl">
              Requests to the Telemetry API must include your key in the <code className="text-[#FF5A1F] bg-[#161616] px-1.5 py-0.5 rounded text-sm font-mono">X-API-Key</code> header.
              You can manage your API keys in the Developer Portal.
            </p>
            <CodeBlock label="SHELL REQUEST" code={`curl -X GET "${apiBase}/telemetry/?session_id=1&driver=VER" \\
  -H "X-API-Key: rc_free_YOUR_KEY"`} />
          </section>

          {/* Streaming data types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Streaming Data Types</h2>
            <p className="text-[#9A9AA5] mb-6 max-w-2xl">
              We support three primary stream types, optimized for different use cases ranging from live broadcast graphics to deep engineering analysis.
            </p>
            <div className="space-y-px bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#1C1C1C]">
              {STREAM_TYPES.map(s => (
                <div key={s.title} className="flex items-start gap-4 p-5 bg-[#0d0d0d]">
                  <div className="w-9 h-9 rounded-lg bg-[#161616] border border-[#262626] flex items-center justify-center text-[#FF5A1F] shrink-0">{s.icon}</div>
                  <div>
                    <div className="font-semibold mb-0.5">{s.title}</div>
                    <div className="text-sm text-[#9A9AA5]">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* JSON schema */}
          <section id="schema" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">JSON Payload Schema</h2>
            <p className="text-[#9A9AA5] mb-4 max-w-2xl">
              The following JSON object represents a typical telemetry frame for a single car during an active session.
            </p>
            <CodeBlock label="RESPONSE EXAMPLE" code={`{
  "session_id": 1,
  "driver": "VER",
  "source": "db",
  "frames": 240,
  "data": [
    {
      "time_ms": 0,
      "speed": 284.5,
      "rpm": 11450,
      "gear": 7,
      "throttle": 100.0,
      "brake": 0.0,
      "drs": 1
    }
  ]
}`} />
          </section>

          {/* WebSocket */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">WebSocket Subscription</h2>
            <p className="text-[#9A9AA5] mb-4 max-w-2xl">
              Open a socket and send a subscribe frame to begin receiving live telemetry at ~10Hz per driver.
            </p>
            <CodeBlock label="WEBSOCKET" code={`const ws = new WebSocket("${(process.env.NEXT_PUBLIC_WS_URL||'ws://localhost:8000')}/ws/stream")
ws.onopen = () => ws.send(JSON.stringify({
  type: "subscribe",
  season: 2025, race: "monaco_gp", session: "race",
  drivers: ["VER","LEC"],
  channels: ["speed","throttle","brake","gear","drs"]
}))
ws.onmessage = ({ data }) => console.log(JSON.parse(data))`} />
          </section>
        </div>

        {/* On this page */}
        <aside className="w-56 shrink-0 border-l border-[#1C1C1C] px-6 py-10 sticky top-16 self-start hidden lg:block">
          <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-4">ON THIS PAGE</div>
          <nav className="space-y-2 mb-8">
            {ON_THIS_PAGE.map((item, i) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className={`block text-sm transition-colors ${i === 2 ? 'text-[#FF5A1F]' : 'text-[#9A9AA5] hover:text-white'}`}>
                {item}
              </a>
            ))}
          </nav>
          <div className="text-xs font-mono tracking-widest text-[#5A5A62] mb-3">HELPFUL LINKS</div>
          <div className="space-y-2">
            <a href="/playground" className="block text-sm text-[#9A9AA5] hover:text-white">⌁ API Playground</a>
            <a href="/developer" className="block text-sm text-[#9A9AA5] hover:text-white">⌗ SDK Libraries</a>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1C1C1C] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1C1C1C] bg-[#111111]">
        <span className="text-xs font-mono tracking-widest text-[#5A5A62]">{label}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(code)}
          className="text-xs text-[#9A9AA5] hover:text-white flex items-center gap-1.5"
        >▢ Copy</button>
      </div>
      <pre className="p-4 font-mono text-xs text-[#9A9AA5] overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}
