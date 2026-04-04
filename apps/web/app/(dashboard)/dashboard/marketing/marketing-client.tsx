'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Users, Send, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react'
import { sendWhatsAppBlast } from '@/lib/actions/marketing'

interface Props {
  audienceStats: {
    totalWithPhone: number
    last30: number
    last90: number
    inactive: number
  }
}

const FILTERS = [
  { value: 'all', label: 'Todos os clientes', description: 'Com WhatsApp cadastrado', key: 'totalWithPhone' as const },
  { value: 'last30', label: 'Ativos (30 dias)', description: 'Vieram nos últimos 30 dias', key: 'last30' as const },
  { value: 'last90', label: 'Ativos (90 dias)', description: 'Vieram nos últimos 90 dias', key: 'last90' as const },
  { value: 'inactive', label: 'Inativos (+60 dias)', description: 'Não vêm há mais de 60 dias', key: 'inactive' as const },
]

const MESSAGE_TEMPLATES = [
  {
    label: 'Promoção',
    text: '🎉 Olá! Temos uma promoção especial para você nesta semana. Agende seu horário e aproveite! 💈',
  },
  {
    label: 'Reativação',
    text: '✂️ Olá! Sentimos sua falta! Que tal marcar um horário? Estamos prontos para te atender. 💈',
  },
  {
    label: 'Novidade',
    text: '🆕 Novidades na nossa barbearia! Venha conferir nossos novos serviços e produtos. Agende agora! 💈',
  },
  {
    label: 'Lembrança',
    text: '⏰ Já está na hora de renovar o visual! Agende seu horário agora e saia ainda hoje com um look incrível. 💈',
  },
]

export function MarketingClient({ audienceStats }: Props) {
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null)

  const selectedFilter = FILTERS.find((f) => f.value === filter)!
  const audienceSize = audienceStats[selectedFilter.key]

  function handleSubmit() {
    if (!message.trim() || audienceSize === 0) return
    setResult(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('message', message)
      fd.set('filter', filter)
      const res = await sendWhatsAppBlast(fd)
      if (res.success) {
        setResult({ success: true, text: `✅ Disparo enfileirado para ${res.queued} contatos!` })
        setMessage('')
      } else {
        setResult({ success: false, text: res.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Marketing</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Envie mensagens em massa via WhatsApp para seus clientes.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: audience + compose */}
        <div className="lg:col-span-2 space-y-5">
          {/* Audience selector */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              Selecionar público
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map((f) => {
                const count = audienceStats[f.key]
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={[
                      'rounded-lg border p-3 text-left transition-all',
                      filter === f.value
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700',
                    ].join(' ')}
                  >
                    <p className={`text-sm font-medium ${filter === f.value ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {f.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{f.description}</p>
                    <p className={`text-lg font-bold mt-1 ${filter === f.value ? 'text-amber-400' : 'text-zinc-100'}`}>
                      {count}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message composer */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Compor mensagem
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={5}
              maxLength={1000}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{message.length}/1000 caracteres</span>
              <div className="flex items-center gap-2">
                {audienceSize > 0 ? (
                  <span className="text-xs text-zinc-400">
                    Enviando para <span className="font-semibold text-amber-400">{audienceSize}</span> contatos
                  </span>
                ) : (
                  <span className="text-xs text-red-400">Nenhum contato no público selecionado</span>
                )}
              </div>
            </div>

            {result && (
              <div className={[
                'rounded-lg border px-4 py-3 text-sm flex items-center gap-2',
                result.success
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400',
              ].join(' ')}>
                {result.success
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                  : <AlertCircle className="h-4 w-4 shrink-0" />}
                {result.text}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || !message.trim() || audienceSize === 0}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enfileirando...</>
              ) : (
                <><Send className="h-4 w-4" /> Disparar mensagem</>
              )}
            </button>
          </div>
        </div>

        {/* Right: templates + tips */}
        <div className="space-y-5">
          {/* Templates */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Templates rápidos
            </h2>
            <div className="space-y-2">
              {MESSAGE_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setMessage(t.text)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 text-left hover:border-zinc-700 hover:bg-zinc-800 transition-all"
                >
                  <p className="text-xs font-semibold text-amber-400 mb-1">{t.label}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{t.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dicas</p>
            {[
              'Os envios são realizados com 1s de intervalo para evitar bloqueio',
              'Personalize a mensagem com o nome do cliente quando possível',
              'Evite disparos após 20h ou antes das 8h',
              'Limite disparos a 1x por semana por público',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2">
                <span className="text-amber-500 text-xs mt-0.5">•</span>
                <p className="text-xs text-zinc-500">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
