import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWARegister } from '@/components/pwa-register'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: { default: 'BarberPro', template: '%s | BarberPro' },
  description: 'Sistema completo de gestão para barbearias',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BarberPro',
  },
}

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <ToastProvider>
          {children}
          <PWARegister />
        </ToastProvider>
      </body>
    </html>
  )
}
