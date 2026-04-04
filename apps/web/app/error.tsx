'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error)
  }, [error])

  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>

      <h1 className="text-2xl font-bold text-zinc-100">Algo deu errado</h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-sm leading-relaxed">
        {error.message && error.message !== 'An error occurred in the Server Components render.'
          ? error.message
          : 'Ocorreu um erro inesperado. Tente novamente ou volte para o início.'}
      </p>

      {error.digest && (
        <p className="mt-2 text-xs text-zinc-600 font-mono">
          Código: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <Home className="h-4 w-4" />
          Ir ao Dashboard
        </button>
      </div>

      <p className="mt-12 text-xs text-zinc-700">BarberPro — Sistema de Gestão para Barbearias</p>
    </div>
  )
}
