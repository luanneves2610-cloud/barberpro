'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail — SW not critical
      })
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Only show banner if not dismissed before
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-zinc-950" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Instalar BarberPro</p>
          <p className="text-xs text-zinc-400 mt-0.5">Adicione à tela inicial para acesso rápido</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Depois
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-zinc-600 hover:text-zinc-400 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
