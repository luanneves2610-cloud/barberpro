'use client'

import { useState, useTransition } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { upsertBarberSchedule, toggleBarberScheduleDay } from '@/lib/actions/tenant'
import type { Barber } from '@barberpro/types'

interface Schedule {
  id: string; barber_id: string; day_of_week: number
  start_time: string; end_time: string; is_active: boolean
}

interface Props {
  barbers: Barber[]
  schedules: Schedule[]
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return `${h}:${m}`
})

export function SchedulesSection({ barbers, schedules }: Props) {
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]?.id ?? '')
  const [editing, setEditing] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [isPending, startTransition] = useTransition()

  const barberSchedules = schedules.filter((s) => s.barber_id === selectedBarber)

  function getSchedule(day: number) {
    return barberSchedules.find((s) => s.day_of_week === day)
  }

  function openEdit(day: number) {
    const s = getSchedule(day)
    setStartTime(s?.start_time ?? '08:00')
    setEndTime(s?.end_time ?? '18:00')
    setEditing(day)
  }

  function saveSchedule() {
    if (editing === null) return
    const fd = new FormData()
    fd.set('barber_id', selectedBarber)
    fd.set('day_of_week', String(editing))
    fd.set('start_time', startTime)
    fd.set('end_time', endTime)
    startTransition(async () => {
      await upsertBarberSchedule(fd)
      setEditing(null)
    })
  }

  if (barbers.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        Cadastre barbeiros primeiro para configurar os horários.
      </div>
    )
  }

  return (
    <div>
      {/* Seletor de barbeiro */}
      <div className="flex flex-wrap gap-2 mb-5">
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => { setSelectedBarber(b.id); setEditing(null) }}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border',
              selectedBarber === b.id
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700',
            ].join(' ')}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, day) => {
          const sched = getSchedule(day)
          const isActive = sched?.is_active ?? false
          const isEditing = editing === day

          return (
            <div
              key={day}
              className={[
                'rounded-xl border p-2 flex flex-col gap-1.5 min-h-[90px]',
                isActive
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-zinc-800 bg-zinc-900',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">{label}</span>
                <button
                  onClick={() => startTransition(() => toggleBarberScheduleDay(selectedBarber, day))}
                  disabled={isPending}
                  className={[
                    'h-3.5 w-3.5 rounded-sm border transition-colors',
                    isActive
                      ? 'bg-amber-500 border-amber-400'
                      : 'bg-transparent border-zinc-600 hover:border-zinc-400',
                  ].join(' ')}
                  title={isActive ? 'Desativar dia' : 'Ativar dia'}
                />
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-100 px-1 py-0.5 focus:outline-none"
                  >
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-100 px-1 py-0.5 focus:outline-none"
                  >
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-1 mt-0.5">
                    <button
                      onClick={saveSchedule}
                      disabled={isPending}
                      className="flex-1 rounded bg-amber-500 text-[9px] font-bold text-zinc-950 py-0.5 hover:bg-amber-400"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 rounded bg-zinc-700 text-[9px] text-zinc-300 py-0.5 hover:bg-zinc-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {sched ? (
                    <div>
                      <p className="text-[10px] text-zinc-300 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {sched.start_time}
                      </p>
                      <p className="text-[10px] text-zinc-300 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {sched.end_time}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-600">Folga</p>
                  )}
                  <button
                    onClick={() => openEdit(day)}
                    className="text-[9px] text-amber-500 hover:text-amber-400 text-left mt-1"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        Clique no quadrado para ativar/desativar o dia. Clique em "Editar" para ajustar os horários.
      </p>
    </div>
  )
}
