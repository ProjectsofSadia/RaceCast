'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'

const EXAMPLES = [
  { label: 'List races', method: 'GET', url: '/races?season=2025' },
  { label: 'Get driver',  method: 'GET', url: '/drivers/VER' },
  { label: 'Telemetry',   method: 'GET', url: '/telemetry?session_id=1&driver=VER&channels=speed,throttle,brake' },
  { label: 'Events',      method: 'GET', url: '/events?session_id=1' },
  { label: 'Weather',     method: 'GET', url: '/weather?session_id=1' },
  { label: 'Create key',  method: 'POST', url: '/keys' },
]

const DEMO_RESPONSES: Record<string, object> = {
  '/races?season=2025': {
    season: 2025, count: 5,
    races: [
      { id: 1, round: 1, name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', date: '2025-03-02' },
      { id: 4, round: 6, name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', date: '2025-05-25' },
    ]
  },
  '/drivers/VER': {
    code: 'VER', number: 1, first_name: 'Max', last_name: 'Verstappen',
    team: 'Red Bull Racing', team_color: '#3671C6', nationality: 'Netherlands'
  },
  '/telemetry?session_id=1&driver=VER&channels=speed,throttle,brake': {
    session_id: 1, driver: 'VER', frames: 200,
    data: [
      { time_ms: 0,   speed: 312.4, throttle: 100, brake: 0 },
      { time_ms: 20,  speed: 308.1, throttle: 98.2, brake: 0 },
      { time_ms: 40,  speed: 281.4, throttle: 42.1, brake: 68.4 },
      { time_ms: 60,  speed: 187.3, throttle: 12.4, brake: 94.2 },
      { time_ms: 80,  speed: 94.2,  throttle: 0,    brake: 100 },
    ]
  },
  '/events?session_id=1': {
    session_id: 1, count: 7,
    events: [
      { lap: 5, event_type: 'YELLOW_FLAG', description: 'Yellow flag sector 2' },
      { lap: 12, event_type: 'PIT_ENTRY', description: 'VER pits — medium tyres', driver_code: 'VER' },
      { lap: 18, event_type: 'SAFETY_CAR', description: 'Safety car deployed' },
    ]
  },
  '/weather?session_id=1': {
    session_id: 1,
    frames: [
      { lap: 1, air_temp: 24.2, track_temp: 38.1, humidity: 42.0, wind_speed: 8.2 },
      { lap: 2, air_temp: 24.4, track_temp: 38.4, humidity: 41.8, wind_speed: 8.1 },
    ]
  },
  '/keys': {
    key: 'rc_a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
    name: 'My App', email: 'dev@example.com', tier: 'free',
    rate_limit: 1000, message: 'Store this key securely.'
  }
}

export default function Playground() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('/races?season=2025')
  const [body, setBody] = useState('{\n  "name": "My App",\n  "email": "dev@example.com",\n  "tier": "free"\n}')
  const [response, setResponse] = useState<object | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'rest' | 'ws'>('rest')

  const [wsStatus, setWsStatus] = useState<'idle' | 'connected'>('idle')
  const [wsMessages, setWsMessages] = useState<string[]>([])

  const runRequest = async () => {
    setLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${base}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body } : {}),
      })
      const json = await res.json()
      setResponse(json)
    } catch (err: any) {
      // Fall back to demo data if backend is offline
      const demo = DEMO_RESPONSES[url] ?? { error: 'Backend offline', hint: 'Start the API on :8000, or this is demo fallback data', data: [] }
      setResponse(demo)
    }
    setLoading(false)
  }

  const connectWs = () => {
    // Real WebSocket connection to the backend stream.
    try {
      const ws = new WebSocket(api.wsUrl())
      ws.onopen = () => {
        setWsStatus('connected')
        ws.send(JSON.stringify({
          type: 'subscribe',
          season: 2025,
          race: 'monaco_gp',
          session: 'race',
          drivers: ['VER', 'LEC'],
          channels: ['speed', 'throttle', 'brake', 'gear', 'drs'],
        }))
      }
      ws.onmessage = (e) => {
        setWsMessages(prev => [e.data, ...prev].slice(0, 20))
      }
      ws.onerror = () => {
        setWsMessages(prev => ['{"type":"error","message":"Connection failed — is the backend running on :8000?"}', ...prev])
        setWsStatus('idle')
      }
      ws.onclose = () => setWsStatus('idle')
      // store so we can close on unmount
      ;(window as any).__racecastWs = ws
    } catch (err) {
      setWsMessages(prev => ['{"type":"error","message":"WebSocket not available"}', ...prev])
    }
  }

  return (
    <AppShell breadcrumb={['Infrastructure', 'API Explorer']}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Playground</h1>
            <p className="text-[#7A7A7A]">Test REST endpoints and WebSocket streams interactively</p>
          </div>
          <div className="flex gap-1 p-1 bg-[#111111] border border-[#1C1C1C] rounded-xl">
            {(['rest', 'ws'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-[#FF5A1F] text-white' : 'text-[#7A7A7A] hover:text-white'}`}>
                {t === 'rest' ? 'REST API' : 'WebSocket'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'rest' ? (
          <div className="grid grid-cols-4 gap-6">
            {/* Examples */}
            <div className="space-y-2">
              <div className="text-xs text-[#7A7A7A] uppercase tracking-widest font-mono mb-3">Quick Examples</div>
              {EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => { setMethod(ex.method); setUrl(ex.url) }}
                  className="w-full text-left p-3 bg-[#111111] border border-[#1C1C1C] rounded-xl hover:border-[#FF5A1F]/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-xs font-bold ${ex.method === 'GET' ? 'text-[#3b82f6]' : 'text-[#22c55e]'}`}>{ex.method}</span>
                  </div>
                  <div className="text-xs text-[#7A7A7A]">{ex.label}</div>
                </button>
              ))}
            </div>

            {/* Request builder */}
            <div className="col-span-3 space-y-4">
              <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1C1C1C]">
                  <div className="flex gap-2">
                    <select value={method} onChange={e => setMethod(e.target.value)}
                      className="bg-[#090909] border border-[#1C1C1C] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#3b82f6] outline-none w-24">
                      <option>GET</option><option>POST</option>
                    </select>
                    <div className="flex items-center flex-1 bg-[#090909] border border-[#1C1C1C] rounded-lg px-3">
                      <span className="text-[#7A7A7A] text-sm font-mono">localhost:8000</span>
                      <input value={url} onChange={e => setUrl(e.target.value)}
                        className="flex-1 bg-transparent font-mono text-sm text-white outline-none px-1 py-2" />
                    </div>
                    <button onClick={runRequest} disabled={loading}
                      className="px-6 py-2 bg-[#FF5A1F] rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50">
                      {loading ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
                {method === 'POST' && (
                  <div className="p-4 border-b border-[#1C1C1C]">
                    <div className="text-xs text-[#7A7A7A] font-mono mb-2">REQUEST BODY</div>
                    <textarea value={body} onChange={e => setBody(e.target.value)}
                      className="w-full bg-[#090909] border border-[#1C1C1C] rounded-lg p-3 font-mono text-xs text-green-400 outline-none resize-none h-28" />
                  </div>
                )}
              </div>

              {/* Response */}
              <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1C1C1C] flex items-center gap-3">
                  <span className="text-sm font-medium">Response</span>
                  {response && <span className="text-xs font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">200 OK</span>}
                </div>
                <pre className="p-4 font-mono text-xs text-[#7A7A7A] overflow-auto max-h-80 leading-relaxed">
                  {response ? JSON.stringify(response, null, 2) : 'Send a request to see the response here.'}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1C1C1C] flex items-center justify-between">
                <h2 className="font-semibold">Subscribe Message</h2>
                <div className="flex items-center gap-2 text-xs font-mono text-[#7A7A7A]">
                  {wsStatus === 'connected'
                    ? <><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />CONNECTED</>
                    : <><div className="w-1.5 h-1.5 rounded-full bg-[#7A7A7A]" />DISCONNECTED</>}
                </div>
              </div>
              <div className="p-5">
                <pre className="font-mono text-xs text-green-400 mb-4 leading-relaxed">{`{
  "type": "subscribe",
  "season": 2025,
  "race": "monaco_gp",
  "session": "race",
  "drivers": ["VER", "LEC"],
  "channels": ["speed","throttle","brake","gear"]
}`}</pre>
                <button onClick={connectWs} disabled={wsStatus === 'connected'}
                  className="w-full py-2.5 bg-[#FF5A1F] rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50">
                  {wsStatus === 'connected' ? '⬤ Streaming...' : 'Connect & Subscribe'}
                </button>
              </div>
            </div>
            <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1C1C1C]">
                <h2 className="font-semibold">Live Stream</h2>
              </div>
              <div className="p-4 font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto">
                {wsMessages.length === 0
                  ? <span className="text-[#7A7A7A]">Connect to see live frames...</span>
                  : wsMessages.map((m, i) => (
                    <div key={i} className="text-green-400 leading-relaxed border-b border-[#1C1C1C] pb-1.5">{m}</div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
