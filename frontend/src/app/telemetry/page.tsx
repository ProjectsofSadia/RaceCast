'use client'
import { useEffect, useRef, useState } from 'react'
import AppShell from '@/components/layout/AppShell'

const DRIVERS_LIST = ['VER', 'NOR', 'LEC', 'SAI', 'HAM', 'RUS', 'ANT', 'ALO', 'PIA']
const CHANNELS = [
  { key: 'speed',    label: 'Speed',    unit: 'km/h', color: '#FF5A1F' },
  { key: 'throttle', label: 'Throttle', unit: '%',    color: '#22c55e' },
  { key: 'brake',    label: 'Brake',    unit: '%',    color: '#eab308' },
  { key: 'rpm',      label: 'RPM',      unit: '',     color: '#a855f7' },
  { key: 'gear',     label: 'Gear',     unit: '',     color: '#3b82f6' },
  { key: 'drs',      label: 'DRS',      unit: '',     color: '#22c55e' },
]

function TelemetryCanvas({ driverA, driverB, activeChannels }: { driverA: string; driverB: string; activeChannels: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height
    const n = activeChannels.length || 1
    const rowH = H / n

    ctx.clearRect(0, 0, W, H)

    activeChannels.forEach((ch, rowIdx) => {
      const y0 = rowIdx * rowH
      const ch_def = CHANNELS.find(c => c.key === ch)
      const offA = (driverA.charCodeAt(0) + driverA.charCodeAt(1)) % 50
      const offB = (driverB.charCodeAt(0) + driverB.charCodeAt(1)) % 50

      // Row bg
      ctx.fillStyle = rowIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
      ctx.fillRect(0, y0, W, rowH)

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let g = 1; g < 4; g++) {
        const gy = y0 + (rowH / 4) * g
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      // Channel label
      ctx.fillStyle = ch_def?.color || '#7A7A7A'
      ctx.font = '700 9px "JetBrains Mono", monospace'
      ctx.fillText(ch.toUpperCase(), 8, y0 + 14)

      // Draw two drivers
      const lines: [string, number, string, number][] = [
        [driverA, offA, ch_def?.color || '#FF5A1F', 1.5],
        [driverB, offB, '#3b82f6', 1],
      ]
      lines.forEach(([, off, color, width]) => {
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const freq = { speed: 0.04, throttle: 0.07, brake: 0.12, rpm: 0.04, gear: 0.04, drs: 0.04 }[ch] || 0.05
          const raw = Math.abs(Math.sin((x + (off as number)) * (freq as number)))
          const y = y0 + rowH - raw * (rowH - 20) - 4
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = color as string
        ctx.lineWidth = width as number
        ctx.stroke()
      })

      // Separator
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, y0 + rowH); ctx.lineTo(W, y0 + rowH); ctx.stroke()
    })
  }, [driverA, driverB, activeChannels])

  return <canvas ref={canvasRef} height={Math.max(400, activeChannels.length * 100)} style={{ width: '100%', height: Math.max(400, activeChannels.length * 100), display: 'block' }} />
}

export default function Telemetry() {
  const [driverA, setDriverA] = useState('VER')
  const [driverB, setDriverB] = useState('LEC')
  const [activeChannels, setActiveChannels] = useState(['speed', 'throttle', 'brake', 'gear'])

  const toggleChannel = (ch: string) => setActiveChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])

  return (
    <AppShell breadcrumb={['Infrastructure', 'Telemetry']}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start gap-6">
          {/* Controls */}
          <div className="w-56 flex-shrink-0 space-y-4">
            <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl p-4">
              <div className="text-xs text-[#7A7A7A] uppercase tracking-widest font-mono mb-3">Driver A</div>
              <select value={driverA} onChange={e => setDriverA(e.target.value)}
                className="w-full bg-[#090909] border border-[#FF5A1F]/30 rounded-lg px-3 py-2 text-sm text-[#FF5A1F] outline-none font-mono font-bold">
                {DRIVERS_LIST.map(d => <option key={d} value={d} className="bg-[#090909] text-white">{d}</option>)}
              </select>
            </div>
            <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl p-4">
              <div className="text-xs text-[#7A7A7A] uppercase tracking-widest font-mono mb-3">Driver B</div>
              <select value={driverB} onChange={e => setDriverB(e.target.value)}
                className="w-full bg-[#090909] border border-[#3b82f6]/30 rounded-lg px-3 py-2 text-sm text-[#3b82f6] outline-none font-mono font-bold">
                {DRIVERS_LIST.map(d => <option key={d} value={d} className="bg-[#090909] text-white">{d}</option>)}
              </select>
            </div>
            <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl p-4">
              <div className="text-xs text-[#7A7A7A] uppercase tracking-widest font-mono mb-3">Channels</div>
              <div className="space-y-1.5">
                {CHANNELS.map(ch => (
                  <button key={ch.key} onClick={() => toggleChannel(ch.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeChannels.includes(ch.key) ? 'bg-[#1C1C1C] text-white' : 'text-[#7A7A7A] hover:bg-[#1C1C1C]'}`}>
                    <div className="w-2 h-2 rounded-full" style={{ background: activeChannels.includes(ch.key) ? ch.color : '#2a2a2a' }} />
                    <span className="font-mono text-xs">{ch.label}</span>
                    {ch.unit && <span className="ml-auto text-xs text-[#7A7A7A]">{ch.unit}</span>}
                  </button>
                ))}
              </div>
            </div>
            <button className="w-full py-2.5 bg-[#FF5A1F] rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors">
              Export CSV
            </button>
          </div>

          {/* Chart */}
          <div className="flex-1 bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C] flex items-center gap-4">
              <h1 className="font-semibold">Telemetry Explorer</h1>
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <div className="w-3 h-0.5 bg-[#FF5A1F] rounded" />
                  <span className="text-[#7A7A7A]">{driverA}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <div className="w-3 h-0.5 bg-[#3b82f6] rounded" />
                  <span className="text-[#7A7A7A]">{driverB}</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              {activeChannels.length === 0
                ? <div className="h-48 flex items-center justify-center text-[#7A7A7A] text-sm">Select at least one channel</div>
                : <TelemetryCanvas driverA={driverA} driverB={driverB} activeChannels={activeChannels} />
              }
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
