'use client'

import { useState, useTransition } from 'react'
import { Scissors, CheckCircle2, XCircle, CalendarDays, Clock, User, Loader2 } from 'lucide-react'
import { confirmAppointmentPresence, cancelAppointmentPublic } from '@/lib/actions/appointments'

interface AppointmentData {
  id: string
  status: string
  confirmedAt: string | null
  date: string
  startTime: string
  endTime: string
  clientName: string
  barberName: string
  serviceName: string
  serviceIcon: string | null
  tenantName: string
  price: number
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type UIState = 'idle' | 'confirmed' | 'cancelled' | 'error' | 'already_confirmed' | 'already_cancelled'

export function ConfirmarClient({ appointment }: { appointment: AppointmentData }) {
  const [isPending, startTransition] = useTransition()
  const [uiState, setUiState] = useState<UIState>(() => {
    if (appointment.status === 'CANCELLED') return 'already_cancelled'
    if (appointment.status === 'COMPLETED') return 'already_cancelled' // can't act
    if (appointment.confirmedAt) return 'already_confirmed'
    return 'idle'
  })
  const [errorMsg, setErrorMsg] = useState('')

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmAppointmentPresence(appointment.id)
      if (res.ok) setUiState('confirmed')
      else { setErrorMsg(res.error ?? 'Erro desconhecido'); setUiState('error') }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelAppointmentPublic(appointment.id)
      if (res.ok) setUiState('cancelled')
      else { setErrorMsg(res.error ?? 'Erro desconhecido'); setUiState('error') }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 mb-4">
            <Scissors className="h-7 w-7 text-zinc-950" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">{appointment.tenantName}</h1>
          <p className="text-sm text-zinc-400 mt-1">Confirmação de agendamento</p>
        </div>

        {/* Appointment card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{appointment.serviceIcon ?? '✂️'}</span>
            <div>
              <p className="font-semibold text-zinc-100">{appointment.serviceName}</p>
              <p className="text-sm text-zinc-400">{fmtCurrency(appointment.price)}</p>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-300">{appointment.clientName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-300 capitalize">{appointment.date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-300">{appointment.startTime} – {appointment.endTime}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Scissors className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-300">{appointment.barberName}</span>
            </div>
          </div>
        </div>

        {/* Action area */}
        {uiState === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-green-400 disabled:opacity-50 transition-colors"
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />}
              Confirmar minha presença
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3.5 text-sm font-medium text-zinc-400 hover:text-red-400 hover:border-red-500/50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancelar agendamento
            </button>
          </div>
        )}

        {(uiState === 'confirmed' || uiState === 'already_confirmed') && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-400 mb-3" />
            <p className="font-semibold text-green-400 text-lg">Presença confirmada!</p>
            <p className="text-sm text-zinc-400 mt-1">
              {uiState === 'already_confirmed'
                ? 'Você já confirmou sua presença anteriormente.'
                : 'Ótimo! Te esperamos no horário combinado. 😊'}
            </p>
          </div>
        )}

        {(uiState === 'cancelled') && (
          <div className="rounded-2xl bg-zinc-800/80 border border-zinc-700 p-6 text-center">
            <XCircle className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
            <p className="font-semibold text-zinc-300 text-lg">Agendamento cancelado</p>
            <p className="text-sm text-zinc-500 mt-1">
              Seu agendamento foi cancelado. Entre em contato para reagendar.
            </p>
          </div>
        )}

        {uiState === 'already_cancelled' && (
          <div className="rounded-2xl bg-zinc-800/80 border border-zinc-700 p-6 text-center">
            <XCircle className="mx-auto h-10 w-10 text-zinc-500 mb-3" />
            <p className="font-semibold text-zinc-400">
              {appointment.status === 'COMPLETED'
                ? 'Este atendimento já foi realizado.'
                : 'Este agendamento já foi cancelado.'}
            </p>
          </div>
        )}

        {uiState === 'error' && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-sm text-red-400">{errorMsg}</p>
            <button onClick={() => setUiState('idle')} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline">
              Tentar novamente
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
