import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#090909', card: '#111111', border: '#1C1C1C',
        primary: '#FF5A1F', 'primary-dim': 'rgba(255,90,31,0.15)',
        secondary: '#7A7A7A',
      },
      fontFamily: {
        sans: ['Inter','Geist','SF Pro Display','-apple-system','sans-serif'],
        mono: ['Geist Mono','JetBrains Mono','monospace'],
      },
      borderRadius: { DEFAULT: '12px', sm: '8px', lg: '16px' },
    },
  },
  plugins: [],
}
export default config
