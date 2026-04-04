import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagamento confirmado',
  robots: { index: false },
}

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de sucesso */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-emerald-400"
            >
              <path d="M20 6L9 17l-5-5" />
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
          Pagamento confirmado!
        </h1>
        <p className="text-zinc-400 mb-2">
          Sua assinatura foi ativada com sucesso.
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          Você receberá um e-mail de confirmação em breve. Caso não encontre,
          verifique a pasta de spam.
        </p>

        {/* Info card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-zinc-300">Acesso imediato a todos os recursos do plano</span>
          </div>
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-zinc-300">Cobrança recorrente mensal via Mercado Pago</span>
          </div>
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-zinc-300">Cancele a qualquer momento pelo painel</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-amber-500/20"
        >
          Ir para o painel
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>

        <p className="text-zinc-600 text-xs mt-6">
          Dúvidas? Entre em contato pelo suporte dentro do painel.
        </p>
      </div>
    </div>
  )
}
