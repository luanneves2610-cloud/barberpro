'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Coffee } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Input } from '@barberpro/ui'
import { createBarberBreak, deleteBarberBreak } from '@/lib/actions/barber-breaks'
import { useToast } from '@/components/ui/toast'
import type { Barber } from '@barberpro/types'

interface BarberBreakRecord {
  id: string
  barber_id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

interface Props {
  barbers: Barber[]
  breaks: BarberBreakRecord[]
}

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return `${h}:${m}`
})

export function BreaksSection({ barbers, breaks }: Props) {
  const { success, error: toastError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')
  const [reason, setReason] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  // Show next 30 days of breaks sorted by date desc
  const upcoming = breaks
    .filter((b) => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const past = breaks
    .filter((b) => b.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  function getBarberName(id: string) {
    return barbers.find((b) => b.id === id)?.name ?? '—'
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('barber_id', selectedBarber)
    fd.set('date', date)
    fd.set('start_time', startTime)
    fd.set('end_time', endTime)
    fd.set('reason', reason)

    startTransition(async () => {
      try {
        await createBarberBreak(fd)
        success('Bloqueio criado com sucesso!')
        setFormOpen(false)
        setDate('')
        setReason('')
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Erro ao criar bloqueio')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteBarberBreak(id)
        success('Bloqueio removido.')
      } catch {
        toastError('Erro ao remover bloqueio')
      }
    })
  }

  if (barbers.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        Cadastre barbeiros primeiro para gerenciar folgas e pausas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + botão */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {upcoming.length} bloqueio(s) agendado(s)
        </p>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          {formOpen ? 'Cancelar' : 'Novo bloqueio'}
        </Button>
      </div>

      {/* Formulário inline */}
      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
            Novo bloqueio de horário
          </p>

          {/* Barbeiro */}
          <div className="flex flex-wrap gap-2">
            {barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBarber(b.id)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
                  selectedBarber === b.id
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700',
                ].join(' ')}
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Data *"
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Início *</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Fim *</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Almoço, consulta médica, folga..."
          />

          <div className="flex justify-end">
            <Button type="submit" loading={isPending} size="sm">
              Salvar bloqueio
            </Button>
          </div>
        </form>
      )}

      {/* Próximos bloqueios */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Próximos bloqueios
            </p>
          </div>
          <ul className="divide-y divide-zinc-800 bg-zinc-900/50">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="rounded-lg bg-amber-500/10 p-1.5 shrink-0">
                  <Coffee className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100">
                    {getBarberName(b.barber_id)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    · {b.start_time}–{b.end_time}
                    {b.reason && ` · ${b.reason}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={isPending}
                  className="rounded p-1.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remover bloqueio"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bloqueios passados (histórico) */}
      {past.length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Histórico recente
            </p>
          </div>
          <ul className="divide-y divide-zinc-800 bg-zinc-900/30">
            {past.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
                <div className="rounded-lg bg-zinc-700/30 p-1.5 shrink-0">
                  <Coffee className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{getBarberName(b.barber_id)}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    · {b.start_time}–{b.end_time}
                    {b.reason && ` · ${b.reason}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && !formOpen && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center">
          <Coffee className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500">Nenhum bloqueio cadastrado.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Crie bloqueios para indicar folgas e pausas na agenda.
          </p>
        </div>
      )}
    </div>
  )
}
