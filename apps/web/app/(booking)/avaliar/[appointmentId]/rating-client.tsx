'use client'

import { useState, useTransition } from 'react'
import { Star, Send, CheckCircle2, Loader2, Scissors } from 'lucide-react'

interface Props {
  appointmentId: string
  barberName: string
  serviceName: string
  clientName: string
  tenantName: string
  date: string
}

export function RatingClient({ appointmentId, barberName, serviceName, clientName, tenantName, date }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente!']

  function handleSubmit() {
    if (rating === 0) return
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, rating, comment }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Erro ao enviar avaliação.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
          <CheckCircle2 className="h-10 w-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">Obrigado!</h2>
        <p className="text-zinc-400">Sua avaliação foi enviada. Ficamos felizes em saber o que você acha! 🙏</p>
        <div className="flex justify-center gap-1">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 mb-1">
          <Scissors className="h-7 w-7 text-zinc-950" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100">{tenantName}</h1>
        <p className="text-sm text-zinc-400">Como foi seu atendimento?</p>
      </div>

      {/* Appointment summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Serviço</span>
          <span className="text-zinc-200">{serviceName}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Barbeiro</span>
          <span className="text-zinc-200">{barberName}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Data</span>
          <span className="text-zinc-400 capitalize">{date}</span>
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={[
                  'h-10 w-10 transition-colors',
                  (hovered || rating) >= star
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700',
                ].join(' ')}
              />
            </button>
          ))}
        </div>
        <p className={`text-sm font-medium min-h-[20px] transition-all ${
          (hovered || rating) > 0 ? 'text-amber-400' : 'text-transparent'
        }`}>
          {LABELS[hovered || rating]}
        </p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Comentário (opcional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conta como foi o atendimento..."
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isPending}
        className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
        ) : (
          <><Send className="h-4 w-4" /> Enviar avaliação</>
        )}
      </button>

      <p className="text-center text-xs text-zinc-600">
        Olá, {clientName}! Sua opinião nos ajuda a melhorar. 💈
      </p>
    </div>
  )
}
