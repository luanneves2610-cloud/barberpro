'use client'

import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, DollarSign, TrendingUp,
  CheckCircle2, Clock, XCircle, Download, CalendarDays,
} from 'lucide-react'

interface Metrics {
  totalRevenue: number
  avgTicket: number
  completedCount: number
  scheduledCount: number
  inProgressCount: number
  cancelledCount: number
  totalCount: number
}

interface PaymentEntry { method: string; amount: number }
interface BarberEntry {
  id: string; name: string; commissionPct: number
  revenue: number; commission: number; count: number
}
interface AppointmentEntry {
  id: string; startTime: string; endTime: string; status: string
  clientName: string; barberName: string; serviceName: string
  price: number; paymentMethod: string | null
}

interface Props {
  date: string
  metrics: Metrics
  byPayment: PaymentEntry[]
  byBarber: BarberEntry[]
  appointments: AppointmentEntry[]
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CASH: 'Dinheiro', CREDIT_CARD: 'Cartão de Crédito', DEBIT_CARD: 'Cartão de Débito', PENDING: 'Pendente',
}
const PAYMENT_COLORS: Record<string, string> = {
  PIX: 'bg-green-500/60', CASH: 'bg-blue-500/60', CREDIT_CARD: 'bg-purple-500/60', DEBIT_CARD: 'bg-amber-500/60', PENDING: 'bg-zinc-600',
}
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído', SCHEDULED: 'Agendado', IN_PROGRESS: 'Em andamento', CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-500/15 text-green-400 ring-green-500/30',
  SCHEDULED: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  CANCELLED: 'bg-zinc-700/50 text-zinc-500 ring-zinc-600/30',
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDateDisplay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs shrink-0">
      {initials}
    </div>
  )
}

export function CaixaClient({ date, metrics, byPayment, byBarber, appointments }: Props) {
  const router = useRouter()

  function navigate(delta: number) {
    const [y, m, d] = date.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() + delta)
    const next = current.toISOString().slice(0, 10)
    router.push(`/dashboard/caixa?date=${next}`)
  }

  const isToday = date === new Date().toISOString().slice(0, 10)
  const maxRevenue = Math.max(...byBarber.map((b) => b.revenue), 1)
  const maxPayment = Math.max(...byPayment.map((p) => p.amount), 1)

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[240px] text-center">
            <p className="text-sm font-semibold text-zinc-100 capitalize">{fmtDateDisplay(date)}</p>
            {isToday && <span className="text-xs text-amber-400">Hoje</span>}
          </div>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <a
          href={`/api/export/caixa?date=${date}`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
          <div className="rounded-lg p-2 bg-green-500/10 shrink-0">
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 mb-1">Faturamento</p>
            <p className="text-lg font-bold text-green-400 truncate">{fmtCurrency(metrics.totalRevenue)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
          <div className="rounded-lg p-2 bg-amber-500/10 shrink-0">
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 mb-1">Ticket médio</p>
            <p className="text-lg font-bold text-zinc-100 truncate">{fmtCurrency(metrics.avgTicket)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
          <div className="rounded-lg p-2 bg-blue-500/10 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 mb-1">Concluídos</p>
            <p className="text-lg font-bold text-zinc-100">
              {metrics.completedCount}
              <span className="text-xs text-zinc-500 font-normal ml-1">/ {metrics.totalCount}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
          <div className="rounded-lg p-2 bg-zinc-700/50 shrink-0">
            <CalendarDays className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 mb-1">Pendentes / Cancel.</p>
            <p className="text-lg font-bold text-zinc-100">
              {metrics.scheduledCount + metrics.inProgressCount}
              <span className="text-xs text-zinc-500 font-normal ml-1">/ {metrics.cancelledCount} cancel.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment breakdown */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Por forma de pagamento</h3>
          {byPayment.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">Nenhuma receita registrada</p>
          ) : (
            <div className="space-y-3">
              {byPayment.map(({ method, amount }) => (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-300">{PAYMENT_LABELS[method] ?? method}</span>
                    <span className="text-sm font-semibold text-zinc-100">{fmtCurrency(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${PAYMENT_COLORS[method] ?? 'bg-zinc-600'}`}
                      style={{ width: `${(amount / maxPayment) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {metrics.totalRevenue > 0
                      ? `${((amount / metrics.totalRevenue) * 100).toFixed(0)}% do total`
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barber breakdown */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Por barbeiro</h3>
          {byBarber.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">Nenhum serviço concluído</p>
          ) : (
            <div className="space-y-4">
              {byBarber.map((b) => (
                <div key={b.id}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <InitialsAvatar name={b.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200 truncate">{b.name}</span>
                        <span className="text-sm font-semibold text-zinc-100 ml-2">{fmtCurrency(b.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-zinc-500">{b.count} serviço{b.count !== 1 ? 's' : ''} · {b.commissionPct}% comis.</span>
                        <span className="text-xs text-amber-400 font-medium">pagar {fmtCurrency(b.commission)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden ml-11">
                    <div
                      className="h-full rounded-full bg-amber-500/60"
                      style={{ width: `${(b.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Total commission payable */}
              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Total a pagar em comissões</span>
                <span className="text-sm font-bold text-amber-400">
                  {fmtCurrency(byBarber.reduce((s, b) => s + b.commission, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointments list */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-300">Atendimentos do dia</h3>
        </div>
        {appointments.length === 0 ? (
          <div className="bg-zinc-900/50 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-400">Nenhum agendamento neste dia</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Horário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Serviço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Barbeiro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-400 tabular-nums">
                    {a.startTime} – {a.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{a.clientName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 hidden sm:table-cell">{a.serviceName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 hidden md:table-cell">{a.barberName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-100">
                    {a.status === 'COMPLETED' ? fmtCurrency(a.price) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[a.status] ?? 'bg-zinc-700/50 text-zinc-400 ring-zinc-600/30'}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-900">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-zinc-400 hidden md:table-cell">
                  {metrics.completedCount} concluído{metrics.completedCount !== 1 ? 's' : ''}
                </td>
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-zinc-400 md:hidden">
                  {metrics.completedCount} concluído{metrics.completedCount !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-green-400 hidden md:table-cell">
                  {fmtCurrency(metrics.totalRevenue)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
