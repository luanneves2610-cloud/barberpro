'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, CalendarDays, Download } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { AppointmentForm } from './appointment-form'
import { AgendaClient } from './agenda-client'
import { AgendaTimeline } from './agenda-timeline'
import { AgendaWeek } from './agenda-week'
import type { Barber, Service, Client } from '@barberpro/types'

type ViewMode = 'list' | 'timeline' | 'week'

interface Props {
  appointments: any[]
  barbers: Barber[]
  services: Service[]
  clients: Client[]
  products: any[]
  breaks: any[]
  date: string
  metrics: { total: number; completed: number; inProgress: number; revenue: number }
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00')
  // Monday of this week
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1 // 0=Mon..6=Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd.toISOString().slice(0, 10)
  })
}

export function AgendaShell({ appointments, barbers, services, clients, products, breaks, date, metrics }: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('timeline')
  const [modalOpen, setModalOpen] = useState(false)
  const weekDates = getWeekDates(date)

  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  function navigate(days: number) {
    router.push(`/dashboard/agenda?date=${addDays(date, days)}`)
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="text-sm font-semibold text-zinc-100 capitalize">{fmtDate(date)}</p>
            {isToday && <p className="text-xs text-amber-400">Hoje</p>}
          </div>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => router.push('/dashboard/agenda')}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {(
              [
                { key: 'timeline', label: 'Timeline', Icon: LayoutGrid },
                { key: 'list',     label: 'Lista',    Icon: LayoutList },
                { key: 'week',     label: 'Semana',   Icon: CalendarDays },
              ] as const
            ).map(({ key, label, Icon }, i) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={[
                  'px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors',
                  i > 0 ? 'border-l border-zinc-700' : '',
                  view === key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Export CSV do dia */}
          <a
            href={`/api/export/agenda?range=dia&date=${date}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Exportar agenda do dia"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>

          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: metrics.total, color: 'text-zinc-100' },
          { label: 'Concluídos', value: metrics.completed, color: 'text-green-400' },
          { label: 'Em andamento', value: metrics.inProgress, color: 'text-amber-400' },
          { label: 'Receita', value: fmtCurrency(metrics.revenue), color: 'text-zinc-100' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-400 mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {view === 'timeline' && (
        <AgendaTimeline
          appointments={appointments}
          barbers={barbers}
          services={services}
          clients={clients}
          products={products}
          breaks={breaks}
          date={date}
          onNewAppointment={() => setModalOpen(true)}
        />
      )}
      {view === 'list' && (
        <AgendaClient
          appointments={appointments}
          barbers={barbers}
          services={services}
          clients={clients}
          products={products}
          date={date}
          metrics={metrics}
          onNewAppointment={() => setModalOpen(true)}
        />
      )}
      {view === 'week' && (
        <AgendaWeek
          appointments={appointments}
          weekDates={weekDates}
          barbers={barbers}
          onDayClick={(d) => {
            setView('timeline')
            router.push(`/dashboard/agenda?date=${d}`)
          }}
        />
      )}

      {/* New appointment modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo agendamento" size="lg">
        <AppointmentForm
          barbers={barbers}
          services={services}
          clients={clients}
          defaultDate={date}
          onSuccess={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}
