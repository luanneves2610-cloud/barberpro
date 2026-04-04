'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Coffee, AlertTriangle } from 'lucide-react'
import { CheckoutModal } from '@/components/dashboard/checkout-modal'
import { StatusBadge } from '@/components/ui/status-badge'
import { updateAppointmentStatus, cancelAppointment } from '@/lib/actions/appointments'
import { deleteBarberBreak, createBarberBreak } from '@/lib/actions/barber-breaks'
import type { Appointment, Barber, Service, Client } from '@barberpro/types'
import { useRouter } from 'next/navigation'

type FullAppointment = Appointment & { client: Client; barber: Barber; service: Service }

interface BarberBreak {
  id: string
  barber_id: string
  start_time: string
  end_time: string
  reason: string | null
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
}

interface Props {
  appointments: FullAppointment[]
  barbers: Barber[]
  services: Service[]
  clients: Client[]
  products: Product[]
  breaks: BarberBreak[]
  date: string
  onNewAppointment: () => void
}

// Timeline from 07:00 to 21:00 = 840 min
const TIMELINE_START = 7 * 60  // 07:00
const TIMELINE_END = 21 * 60   // 21:00
const TOTAL_MINUTES = TIMELINE_END - TIMELINE_START
const HOUR_HEIGHT = 64 // px per hour
const TOTAL_HEIGHT = (TOTAL_MINUTES / 60) * HOUR_HEIGHT

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number): number {
  return ((minutes - TIMELINE_START) / 60) * HOUR_HEIGHT
}

function durationToPx(durationMin: number): number {
  return (durationMin / 60) * HOUR_HEIGHT
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  IN_PROGRESS: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  COMPLETED: 'bg-green-500/15 border-green-500/30 text-green-400',
  CANCELLED: 'bg-red-500/10 border-red-500/20 text-red-400 opacity-50',
  NO_SHOW: 'bg-zinc-700/50 border-zinc-600 text-zinc-500 opacity-50',
}

const HOURS = Array.from({ length: TIMELINE_END / 60 - TIMELINE_START / 60 + 1 }, (_, i) => TIMELINE_START / 60 + i)

export function AgendaTimeline({ appointments, barbers, services, clients, products, breaks, date, onNewAppointment }: Props) {
  const router = useRouter()
  const [checkoutAppt, setCheckoutAppt] = useState<FullAppointment | null>(null)
  const [addBreakBarberId, setAddBreakBarberId] = useState<string | null>(null)
  const [breakStart, setBreakStart] = useState('12:00')
  const [breakEnd, setBreakEnd] = useState('13:00')
  const [breakReason, setBreakReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [tooltip, setTooltip] = useState<string | null>(null)

  function handleAddBreak() {
    if (!addBreakBarberId) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('barber_id', addBreakBarberId)
      fd.set('date', date)
      fd.set('start_time', breakStart)
      fd.set('end_time', breakEnd)
      fd.set('reason', breakReason)
      await createBarberBreak(fd)
      setAddBreakBarberId(null)
      setBreakReason('')
    })
  }

  // Generate time slots every 30 min for click-to-create
  function getClickTime(y: number): string {
    const minutes = TIMELINE_START + Math.floor((y / TOTAL_HEIGHT) * TOTAL_MINUTES)
    const snapped = Math.round(minutes / 30) * 30
    const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END - 30, snapped))
    return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
  }

  const appointmentsByBarber = new Map<string, FullAppointment[]>()
  for (const b of barbers) {
    appointmentsByBarber.set(b.id, appointments.filter((a) => a.barber_id === b.id))
  }

  const breaksByBarber = new Map<string, BarberBreak[]>()
  for (const b of barbers) {
    breaksByBarber.set(b.id, breaks.filter((br) => br.barber_id === b.id))
  }

  const currentMinute = (() => {
    const now = new Date()
    const today = new Date().toISOString().slice(0, 10)
    if (date !== today) return null
    return now.getHours() * 60 + now.getMinutes()
  })()

  return (
    <>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* Column headers */}
        <div className="flex border-b border-zinc-800">
          {/* Time gutter */}
          <div className="w-14 shrink-0 border-r border-zinc-800 bg-zinc-900/80 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Hora</span>
          </div>
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="flex-1 min-w-[160px] px-3 py-2.5 border-r border-zinc-800 last:border-r-0 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                  {barber.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-zinc-200 truncate">{barber.name}</span>
              </div>
              <button
                onClick={() => {
                  setAddBreakBarberId(barber.id)
                  setBreakStart('12:00')
                  setBreakEnd('13:00')
                  setBreakReason('')
                }}
                className="text-zinc-600 hover:text-zinc-400 transition-colors ml-1 shrink-0"
                title="Adicionar bloqueio de horário"
              >
                <Coffee className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Timeline body */}
        <div className="flex overflow-x-auto">
          {/* Hour labels */}
          <div className="w-14 shrink-0 border-r border-zinc-800 relative" style={{ height: TOTAL_HEIGHT }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: minutesToPx(h * 60), height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-zinc-600 leading-none mt-0.5">
                  {String(h).padStart(2, '0')}h
                </span>
              </div>
            ))}
          </div>

          {/* Barber columns */}
          {barbers.map((barber) => {
            const barberAppts = appointmentsByBarber.get(barber.id) ?? []
            const barberBreaks = breaksByBarber.get(barber.id) ?? []

            return (
              <div
                key={barber.id}
                className="flex-1 min-w-[160px] border-r border-zinc-800 last:border-r-0 relative"
                style={{ height: TOTAL_HEIGHT }}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-zinc-800/60"
                    style={{ top: minutesToPx(h * 60) }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOURS.slice(0, -1).map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-zinc-800/20"
                    style={{ top: minutesToPx(h * 60 + 30) }}
                  />
                ))}

                {/* Current time indicator */}
                {currentMinute !== null && currentMinute >= TIMELINE_START && currentMinute <= TIMELINE_END && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: minutesToPx(currentMinute) }}
                  >
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  </div>
                )}

                {/* Breaks */}
                {barberBreaks.map((br) => {
                  const startMin = timeToMinutes(br.start_time)
                  const endMin = timeToMinutes(br.end_time)
                  if (startMin >= TIMELINE_END || endMin <= TIMELINE_START) return null
                  const top = minutesToPx(Math.max(startMin, TIMELINE_START))
                  const height = durationToPx(Math.min(endMin, TIMELINE_END) - Math.max(startMin, TIMELINE_START))

                  return (
                    <div
                      key={br.id}
                      className="absolute left-1 right-1 rounded-md bg-zinc-700/50 border border-zinc-600/40 z-10 flex items-start p-1.5 gap-1 group"
                      style={{ top, height: Math.max(height, 20) }}
                    >
                      <Coffee className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-400 truncate">{br.reason ?? 'Bloqueado'}</p>
                        <p className="text-[10px] text-zinc-600">{br.start_time}–{br.end_time}</p>
                      </div>
                      <button
                        onClick={() => startTransition(() => deleteBarberBreak(br.id))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}

                {/* Appointments */}
                {barberAppts.map((appt) => {
                  const startMin = timeToMinutes(appt.start_time)
                  const endMin = timeToMinutes(appt.end_time)
                  if (startMin >= TIMELINE_END || endMin <= TIMELINE_START) return null
                  const top = minutesToPx(Math.max(startMin, TIMELINE_START))
                  const height = durationToPx(Math.min(endMin, TIMELINE_END) - Math.max(startMin, TIMELINE_START))
                  const colorClass = STATUS_COLORS[appt.status] ?? STATUS_COLORS.SCHEDULED
                  const isShort = height < 48

                  return (
                    <div
                      key={appt.id}
                      className={`absolute left-1 right-1 rounded-lg border z-10 overflow-hidden cursor-pointer transition-all hover:z-30 hover:shadow-lg ${colorClass}`}
                      style={{ top, height: Math.max(height, 24) }}
                      onClick={() => {
                        if (appt.status === 'IN_PROGRESS') setCheckoutAppt(appt)
                      }}
                    >
                      <div className="p-1.5 h-full flex flex-col">
                        <div className="flex items-center gap-1">
                          <p className="text-[11px] font-semibold leading-tight truncate flex-1">{appt.client.name}</p>
                          {appt.confirmed_at && (
                            <span title="Presença confirmada" className="text-green-400 shrink-0">✓</span>
                          )}
                        </div>
                        {!isShort && (
                          <>
                            <p className="text-[10px] opacity-80 truncate">{appt.service.name}</p>
                            <p className="text-[10px] opacity-60">{appt.start_time}–{appt.end_time}</p>
                          </>
                        )}
                        {/* Quick actions on hover */}
                        {appt.status === 'SCHEDULED' && !isShort && (
                          <div className="mt-auto flex gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                            <button
                              className="text-[10px] bg-amber-500/30 hover:bg-amber-500/50 rounded px-1.5 py-0.5 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                startTransition(() => updateAppointmentStatus(appt.id, 'IN_PROGRESS'))
                              }}
                            >
                              Iniciar
                            </button>
                            <button
                              className="text-[10px] bg-red-500/20 hover:bg-red-500/30 rounded px-1.5 py-0.5 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                startTransition(() => cancelAppointment(appt.id))
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {appt.status === 'IN_PROGRESS' && !isShort && (
                          <div className="mt-auto">
                            <span className="text-[10px] bg-green-500/30 rounded px-1.5 py-0.5">
                              ✓ Finalizar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add break modal */}
      {addBreakBarberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80" onClick={() => setAddBreakBarberId(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">Bloquear horário</h3>
              <button onClick={() => setAddBreakBarberId(null)} className="text-zinc-500 hover:text-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {barbers.find((b) => b.id === addBreakBarberId)?.name} · {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Início</label>
                <select
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  {Array.from({ length: 28 }, (_, i) => {
                    const min = TIMELINE_START + i * 30
                    const label = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
                    return <option key={label} value={label}>{label}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fim</label>
                <select
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  {Array.from({ length: 28 }, (_, i) => {
                    const min = TIMELINE_START + 30 + i * 30
                    const label = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
                    return <option key={label} value={label}>{label}</option>
                  })}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Motivo (opcional)</label>
              <input
                value={breakReason}
                onChange={(e) => setBreakReason(e.target.value)}
                placeholder="Ex: Almoço, Médico..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleAddBreak}
              disabled={isPending}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60"
            >
              {isPending ? 'Salvando...' : 'Bloquear horário'}
            </button>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutAppt && (
        <CheckoutModal
          appointment={{
            id: checkoutAppt.id,
            clientName: checkoutAppt.client.name,
            serviceName: checkoutAppt.service.name,
            price: Number(checkoutAppt.price),
            barberName: checkoutAppt.barber.name,
          }}
          products={products}
          onClose={() => setCheckoutAppt(null)}
          onSuccess={() => {
            setCheckoutAppt(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
