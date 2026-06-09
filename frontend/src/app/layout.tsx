import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'RaceCast — F1 Telemetry Streaming Platform',
  description: 'Replay Formula 1 Like It\'s Live. Historical replay, live updates, telemetry streaming, and developer APIs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-white min-h-screen">{children}</body>
    </html>
  )
}
