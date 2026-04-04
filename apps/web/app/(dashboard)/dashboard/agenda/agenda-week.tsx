'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useTransition } from 'react'
import { updateAppointmentStatus, cancelAppointment } from '@/lib/actions/appointments'
import type { Barber, Service, Client, Appointment } from '@barberpro/types'

type FullAppointment = Appointment & { client: Client; barber: Barber; service: Service }

interface Props {
  appointments: FullAppointment[]  // All appointments for the week
  weekDates: string[]              // 7 ISO date strings (Mon–Sun)
  barbers: Barber[]
  onDayClick: (date: string) => void
}

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-blue-400',
  IN_PROGRESS: 'bg-amber-400',
  COMPLETED: 'bg-green-400',
  CANCELLED: 'bg-red-400/50',
  NO_SHOW: 'bg-zinc-500',
}

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AgendaWeek({ appointments, weekDates, onDayClick }: Props) {
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  const byDate = new Map<string, FullAppointment[]>()
  for (const d of weekDates) byDate.set(d, [])
  for (const a of appointments) {
    const key = new Date(a.date).toISOString().slice(0, 10)
    if (byDate.has(key)) byDate.get(key)!.push(a)
  }

  const weekRevenue = appointments
    .filter((a) => a.status === 'COMPLETED')
    .reduce((s, a) => s + Number(a.price), 0)

  return (
    <div className="space-y-3">
      {/* Weekly summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-zinc-500">Semana</p>
          <p className="text-sm font-semibold text-zinc-100">
            {new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            {' '}&ndash;{' '}
            {new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
        <div>
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-sm font-bold text-zinc-100">{appointments.length} agendamentos</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Concluídos</p>
          <p className="text-sm font-bold text-green-400">
            {appointments.filter((a) => a.status === 'COMPLETED').length}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Receita</p>
          <p className="text-sm font-bold text-amber-400">{fmtCurrency(weekRevenue)}</p>
        </div>
      </div>

      {/* Day columns grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayAppts = byDate.get(date) ?? []
          const isToday = date === today
          const dayDate = new Date(date + 'T12:00:00')
          const isPast = date < today

          return (
            <div
              key={date}
              onClick={() => onDayClick(date)}
              className={[
                'rounded-xl border cursor-pointer transition-all hover:border-zinc-600 min-h-[120px]',
                isToday
                  ? 'border-amber-500/60 bg-amber-500/5'
                  : isPast
                    ? 'border-zinc-800 bg-zinc-900/50 opacity-70'
                    : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50',
              ].join(' ')}
            >
              {/* Day header */}
              <div className={[
                'px-2 pt-2.5 pb-1.5 border-b text-center',
                isToday ? 'border-amber-500/20' : 'border-zinc-800',
              ].join(' ')}>
                <p className={`text-[10px] font-medium uppercase tracking-wider ${isToday ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {DAY_LABELS[i]}
                </p>
                <p className={`text-lg font-bold leading-none mt-0.5 ${isToday ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {dayDate.getDate()}
                </p>
                {dayAppts.length > 0 && (
                  <p className={`text-[10px] mt-0.5 ${isToday ? 'text-amber-500' : 'text-zinc-500'}`}>
                    {dayAppts.length}
                  </p>
                )}
              </div>

              {/* Appointment blobs */}
              <div className="p-1.5 space-y-1">
                {dayAppts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md bg-zinc-800 border border-zinc-700/50 px-1.5 py-1"
                  >
                    <div className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? 'bg-zinc-500'}`} />
                      <p className="text-[10px] font-medium text-zinc-200 truncate leading-none">{a.start_time}</p>
                    </div>
                    <p className="text-[9px] text-zinc-400 truncate mt-0.5 leading-none">{a.client.name}</p>
                  </div>
                ))}
                {dayAppts.length > 4 && (
                  <p className="text-[9px] text-zinc-500 text-center">+{dayAppts.length - 4} mais</p>
                )}
                {dayAppts.length === 0 && !isPast && (
                  <p className="text-[9px] text-zinc-700 text-center py-2">livre</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
