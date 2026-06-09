'use client'
import Sidebar from './Sidebar'
import { StatusDot } from '@/components/ui/States'

export default function AppShell({
  breadcrumb, children,
}: {
  breadcrumb?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#090909]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 shrink-0 border-b border-[#1C1C1C] flex items-center gap-4 px-8 sticky top-0 bg-[#090909]/90 backdrop-blur-xl z-30">
          {breadcrumb && (
            <div className="flex items-center gap-2 text-sm font-mono">
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className={i === breadcrumb.length - 1 ? 'text-white' : 'text-[#5A5A62]'}>{b}</span>
                  {i < breadcrumb.length - 1 && <span className="text-[#5A5A62]">/</span>}
                </span>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#1C1C1C] text-sm text-[#5A5A62] w-72">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Search API docs…</span>
              <kbd className="ml-auto text-xs font-mono text-[#5A5A62] border border-[#262626] rounded px-1.5">⌘K</kbd>
            </div>
            <StatusDot status="online" label="ALL SYSTEMS OPERATIONAL" />
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
