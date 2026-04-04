'use client'

import { useState, useTransition, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Clock, Loader2, Star, Calendar } from 'lucide-react'
import { createPublicBooking, getAvailableSlots } from '@/lib/actions/public-booking'

interface Barber {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  rating: number
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description: string | null
  icon: string | null
}

interface Props {
  tenantId: string
  barbers: Barber[]
  services: Service[]
}

type Step = 'barber' | 'service' | 'datetime' | 'info' | 'confirm' | 'done'

function formatDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Next 14 days (skip sundays if no barber works sundays — simplified: show all)
function getNext14Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < 21; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-base">
      {initials}
    </div>
  )
}

export function BookingClient({ tenantId, barbers, services }: Props) {
  const [step, setStep] = useState<Step>('barber')
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [confirmedId, setConfirmedId] = useState('')

  const days = getNext14Days()

  // Load slots when date/barber/service selected
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot('')
    getAvailableSlots(tenantId, selectedBarber.id, selectedService.id, selectedDate).then((s) => {
      setSlots(s)
      setLoadingSlots(false)
    })
  }, [tenantId, selectedBarber, selectedService, selectedDate])

  const STEPS: Step[] = ['barber', 'service', 'datetime', 'info', 'confirm']
  const stepLabels: Record<Step, string> = {
    barber: 'Barbeiro',
    service: 'Serviço',
    datetime: 'Data e hora',
    info: 'Seus dados',
    confirm: 'Confirmar',
    done: 'Concluído',
  }

  const currentStepIdx = STEPS.indexOf(step)

  function handleSubmit() {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedSlot) return
    setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.set('tenantId', tenantId)
      fd.set('barberId', selectedBarber.id)
      fd.set('serviceId', selectedService.id)
      fd.set('date', selectedDate)
      fd.set('startTime', selectedSlot)
      fd.set('clientName', clientName)
      fd.set('clientPhone', clientPhone)
      fd.set('clientEmail', clientEmail)
      fd.set('notes', notes)

      const result = await createPublicBooking(fd)
      if (result.success) {
        setConfirmedId(result.appointmentId)
        setStep('done')
      } else {
        setError(result.error)
      }
    })
  }

  // ── DONE ──────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Agendamento confirmado!</h2>
        <p className="text-sm text-zinc-400">
          {selectedBarber?.name} · {selectedService?.name}
        </p>
        <p className="text-sm text-zinc-300 font-medium">
          {formatDateLabel(selectedDate)} às {selectedSlot}
        </p>
        {clientPhone && (
          <p className="text-xs text-zinc-500">
            Você receberá uma confirmação via WhatsApp em {clientPhone}
          </p>
        )}
        <button
          onClick={() => {
            setStep('barber')
            setSelectedBarber(null)
            setSelectedService(null)
            setSelectedDate('')
            setSelectedSlot('')
            setClientName('')
            setClientPhone('')
            setClientEmail('')
            setNotes('')
            setConfirmedId('')
          }}
          className="mt-4 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          Novo agendamento
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={[
              'flex-1 h-1 rounded-full transition-all',
              i < currentStepIdx ? 'bg-amber-500' : i === currentStepIdx ? 'bg-amber-500/60' : 'bg-zinc-800',
            ].join(' ')}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500 text-right">
        Passo {currentStepIdx + 1} de {STEPS.length} — <span className="text-zinc-400">{stepLabels[step]}</span>
      </p>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* ── STEP: BARBER ── */}
        {step === 'barber' && (
          <div className="p-5 space-y-3">
            <h2 className="text-base font-semibold text-zinc-100">Escolha o barbeiro</h2>
            <div className="space-y-2">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBarber(b); setStep('service') }}
                  className="w-full flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-amber-500/40 hover:bg-zinc-800 transition-all"
                >
                  {b.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.avatar_url} alt={b.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <InitialsAvatar name={b.name} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100">{b.name}</p>
                    {b.bio && <p className="text-xs text-zinc-500 truncate">{b.bio}</p>}
                  </div>
                  {b.rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-400 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span className="text-xs font-medium">{b.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: SERVICE ── */}
        {step === 'service' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('barber')} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold text-zinc-100">Escolha o serviço</h2>
            </div>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('datetime') }}
                  className="w-full flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-amber-500/40 hover:bg-zinc-800 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-xl shrink-0">
                    {s.icon ?? '✂️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-zinc-500 truncate">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDuration(s.duration)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-400 shrink-0">
                    {fmtCurrency(s.price)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: DATE & TIME ── */}
        {step === 'datetime' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('service')} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold text-zinc-100">Data e horário</h2>
            </div>

            {/* Date scroller */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Selecione uma data
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {days.map((d) => {
                  const date = new Date(d + 'T12:00:00')
                  const dayOfWeek = date.getDay()
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={[
                        'flex-shrink-0 w-14 rounded-xl border p-2 text-center transition-all',
                        selectedDate === d
                          ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                          : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700',
                      ].join(' ')}
                    >
                      <p className="text-[10px] uppercase font-medium">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]}
                      </p>
                      <p className="text-lg font-bold leading-none">{date.getDate()}</p>
                      <p className="text-[10px]">
                        {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Horários disponíveis
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    Nenhum horário disponível para esta data.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={[
                          'rounded-lg border py-2 text-sm font-medium transition-all',
                          selectedSlot === s
                            ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                            : 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-zinc-700',
                        ].join(' ')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              disabled={!selectedDate || !selectedSlot}
              onClick={() => setStep('info')}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── STEP: CLIENT INFO ── */}
        {step === 'info' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('datetime')} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold text-zinc-100">Seus dados</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome *</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp / Telefone *</label>
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail (opcional)</label>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Observações (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma preferência ou observação..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <button
              disabled={!clientName.trim() || !clientPhone.trim()}
              onClick={() => setStep('confirm')}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Revisar agendamento
            </button>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === 'confirm' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('info')} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold text-zinc-100">Confirmar agendamento</h2>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 divide-y divide-zinc-800">
              {[
                { label: 'Barbeiro', value: selectedBarber?.name },
                { label: 'Serviço', value: selectedService?.name },
                { label: 'Valor', value: selectedService ? fmtCurrency(selectedService.price) : '' },
                { label: 'Duração', value: selectedService ? formatDuration(selectedService.duration) : '' },
                { label: 'Data', value: formatDateLabel(selectedDate) },
                { label: 'Horário', value: selectedSlot },
                { label: 'Nome', value: clientName },
                { label: 'Telefone', value: clientPhone },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-zinc-200">{value}</span>
                  </div>
                ) : null,
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              disabled={isPending}
              onClick={handleSubmit}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar agendamento
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-zinc-600">
              Ao confirmar, você receberá uma mensagem no WhatsApp com os detalhes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
