'use client'
import { motion } from 'framer-motion'

// ── Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, #161616 25%, #1f1f1f 50%, #161616 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function SkeletonRows({ rows = 5, height = 40 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ height }} />
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────
export function EmptyState({
  icon = '◎', title, description, action,
}: {
  icon?: string; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-12 h-12 rounded-xl border border-[#1C1C1C] bg-[#111111] flex items-center justify-center text-2xl text-[#5A5A62] mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-[#9A9AA5] max-w-sm mb-4">{description}</p>}
      {action}
    </motion.div>
  )
}

// ── Error state ───────────────────────────────────────────────────────
export function ErrorState({
  title = 'Something went wrong', message, onRetry,
}: {
  title?: string; message?: string; onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 flex items-center justify-center text-2xl text-[#EF4444] mb-4">
        ⚠
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      {message && <p className="text-sm text-[#9A9AA5] max-w-sm mb-4">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl border border-[#1C1C1C] text-sm text-[#9A9AA5] hover:text-white hover:border-white/30 transition-colors"
        >
          ↺ Retry
        </button>
      )}
    </div>
  )
}

// ── Status dot (color + label for a11y) ──────────────────────────────
export function StatusDot({
  status, label,
}: {
  status: 'live' | 'online' | 'offline' | 'warn'; label: string
}) {
  const colors = {
    live:    '#FF5A1F',
    online:  '#22C55E',
    offline: '#5A5A62',
    warn:    '#EAB308',
  }
  const pulse = status === 'live' || status === 'online'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9A9AA5]">
      <span
        className={pulse ? 'animate-pulse' : ''}
        style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status], flexShrink: 0 }}
        aria-hidden
      />
      {label}
    </span>
  )
}
