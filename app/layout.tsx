import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BusLog',
  description: 'Registre suas viagens de ônibus',
  manifest: '/manifest.json',
  themeColor: '#0e1117',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BusLog',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
