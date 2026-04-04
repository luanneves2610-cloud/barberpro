'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center" style={{ backgroundColor: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Algo deu errado
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
          {error.message ?? 'Erro crítico na aplicação.'}
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#f59e0b',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
