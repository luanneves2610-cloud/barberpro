import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagamento cancelado',
  robots: { index: false },
}

export default function CancelamentoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de cancelamento */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800/60 border-2 border-zinc-700/50 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-zinc-400"
            >
              <circle cx={12} cy={12} r={10} />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xs">B</span>
          </div>
          <span className="font-bold text-sm text-zinc-400">BarberPro</span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-100 mb-3">
          Pagamento não concluído
        </h1>
        <p className="text-zinc-400 mb-2">
          Nenhuma cobrança foi realizada na sua conta.
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          Você pode tentar novamente a qualquer momento. Se precisar de ajuda,
          entre em contato com o nosso suporte.
        </p>

        {/* Possíveis motivos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Possíveis motivos
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
              Pagamento cancelado voluntariamente
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
              Cartão recusado ou dados incorretos
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
              Tempo de sessão expirado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
              Limite insuficiente no cartão
            </li>
          </ul>
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <Link
            href="/dashboard/assinatura"
            className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-amber-500/20"
          >
            Tentar novamente
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Voltar ao painel
          </Link>
        </div>

        <p className="text-zinc-600 text-xs mt-6">
          Precisa de ajuda?{' '}
          <a href="mailto:suporte@barberpro.com.br" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
            suporte@barberpro.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
