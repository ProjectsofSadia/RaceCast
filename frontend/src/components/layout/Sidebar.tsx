'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/overview',   label: 'Overview',        icon: 'grid' },
  { href: '/replay',     label: 'Replay',          icon: 'replay' },
  { href: '/telemetry',  label: 'Telemetry',       icon: 'pulse' },
  { href: '/playground', label: 'API Explorer',    icon: 'terminal' },
  { href: '/developer',  label: 'Developer Portal',icon: 'code' },
  { href: '/docs',       label: 'Documentation',   icon: 'doc' },
  { href: '/settings',   label: 'Settings',        icon: 'gear' },
]

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'grid':     return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'replay':   return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
    case 'pulse':    return <svg {...common}><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
    case 'terminal': return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>
    case 'code':     return <svg {...common}><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>
    case 'doc':      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
    case 'gear':     return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    default:         return null
  }
}

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 bg-[#0c0c0c] border-r border-[#1C1C1C] flex flex-col">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="block">
          <div className="text-[26px] font-bold tracking-tight text-[#FF5A1F] leading-none">RaceCast</div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[#5A5A62] mt-2">F1 INFRASTRUCTURE V2.4</div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = path === item.href || (item.href === '/overview' && path === '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-[#161616] text-white' : 'text-[#9A9AA5] hover:text-white hover:bg-[#111111]'
              }`}>
              <span className={active ? 'text-[#FF5A1F]' : ''}><Icon name={item.icon} /></span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + upgrade */}
      <div className="p-3 border-t border-[#1C1C1C] space-y-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1C1C1C] to-[#262626] border border-[#262626] flex items-center justify-center text-xs font-mono text-[#FF5A1F]">RC</div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">Engineering Lead</div>
            <div className="text-xs font-mono text-[#5A5A62] truncate">Enterprise Plan</div>
          </div>
        </div>
        <button className="w-full py-2.5 bg-[#FF5A1F] hover:bg-orange-500 transition-colors rounded-xl text-sm font-semibold">
          Upgrade Plan
        </button>
      </div>
    </aside>
  )
}
