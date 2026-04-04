import Link from 'next/link'
import { Scissors, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      {/* Logo */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20">
        <Scissors className="h-7 w-7 text-zinc-950" />
      </div>

      {/* 404 */}
      <p className="text-9xl font-black text-zinc-800 leading-none select-none tabular-nums">404</p>

      <h1 className="mt-3 text-2xl font-bold text-zinc-100">Página não encontrada</h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-xs leading-relaxed">
        A página que você está procurando não existe, foi movida ou o link está incorreto.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
        >
          <Home className="h-4 w-4" />
          Ir ao Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Página inicial
        </Link>
      </div>

      <p className="mt-12 text-xs text-zinc-700">BarberPro — Sistema de Gestão para Barbearias</p>
    </div>
  )
}
