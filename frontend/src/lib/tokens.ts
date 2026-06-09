/**
 * RaceCast Design Tokens
 * Single source of truth for color, spacing, and type.
 * Never write hex inline — import from here.
 */

export const color = {
  bg:       '#090909',
  surface:  '#111111',
  surface2: '#161616',
  border:   '#1C1C1C',
  border2:  '#262626',
  primary:  '#FF5A1F',
  primaryDim: 'rgba(255,90,31,0.12)',
  text:     '#FFFFFF',
  muted:    '#9A9AA5',   // raised from #7A7A7A for AA contrast on bg
  faint:    '#5A5A62',

  // semantic
  good: '#22C55E',
  warn: '#EAB308',
  bad:  '#EF4444',
  info: '#3B82F6',

  // tire compounds
  soft:   '#E01C2E',
  medium: '#E8960A',
  hard:   '#9A9AA5',
  inter:  '#1A7FE8',

  // driver comparison
  driverA: '#FF5A1F',
  driverB: '#3B82F6',
} as const

// 8px grid — only use these
export const space = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px',
  6: '24px', 8: '32px', 12: '48px', 16: '64px',
} as const

// Fixed type scale
export const fontSize = {
  xs: '11px', sm: '12px', base: '14px', md: '16px',
  lg: '20px', xl: '28px', '2xl': '40px', '3xl': '56px',
} as const

// Two transitions only
export const motion = {
  fast:     { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  entrance: { duration: 0.4,  ease: [0.16, 1, 0.3, 1] as const },
} as const

// Team colors (2025 grid)
export const teamColor: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'McLaren': '#FF8000',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#0093CC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Haas': '#B6BABD',
  'Kick Sauber': '#52E252',
}

export const tireColor: Record<string, string> = {
  S: color.soft, SOFT: color.soft,
  M: color.medium, MEDIUM: color.medium,
  H: color.hard, HARD: color.hard,
  I: color.inter, INTER: color.inter,
}
