'use client'

import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, DollarSign, Users, CalendarCheck,
  Target, Download, ArrowUpRight, ArrowDownRight, Percent,
} from 'lucide-react'

interface DreData {
  grossRevenue: number
  totalDirectExpenses: number
  netProfit: number
  margin: number
  expensesByCategory: { category: string; total: number }[]
}

interface Props {
  summary: {
    totalRevenue: number; totalExpense: number; profit: number
    appointments: number; completed: number; newClients: number; avgTicket: number
  }
  barberStats: { name: string; revenue: number; count: number; avgTicket: number }[]
  serviceStats: { name: string; count: number; revenue: number }[]
  statusCount: Record<string, number>
  paymentStats: { method: string; total: number }[]
  dre: DreData
  range: string
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CASH: 'Dinheiro', CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito',
  'Não informado': 'Não informado',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado', NO_SHOW: 'Não compareceu',
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-500', IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-green-500', CANCELLED: 'bg-red-500', NO_SHOW: 'bg-zinc-500',
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((v / total) * 100)}%`
}

export function RelatoriosClient({
  summary, barberStats, serviceStats, statusCount, paymentStats, dre, range,
}: Props) {
  const router = useRouter()

  const totalAppt = Object.values(statusCount).reduce((s, v) => s + v, 0)
  const maxBarberRevenue = Math.max(...barberStats.map((b) => b.revenue), 1)
  const maxServiceCount = Math.max(...serviceStats.map((s) => s.count), 1)
  const maxExpense = Math.max(...dre.expensesByCategory.map((e) => e.total), 1)

  return (
    <div className="space-y-6">
      {/* Exportar CSV */}
      <div className="flex flex-wrap gap-2 justify-end">
        {[
          { label: 'Agendamentos', type: 'appointments' },
          { label: 'Financeiro', type: 'transactions' },
          { label: 'Clientes', type: 'clients' },
          { label: 'DRE', type: 'dre' },
        ].map(({ label, type }) => (
          <a
            key={type}
            href={`/api/export/relatorios?type=${type}&range=${range}`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3 w-3" /> {label}
          </a>
        ))}
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: '7 dias', value: '7' },
          { label: '30 dias', value: '30' },
          { label: '90 dias', value: '90' },
          { label: '6 meses', value: '180' },
          { label: '1 ano', value: '365' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => router.push(`/dashboard/relatorios?range=${opt.value}`)}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
              range === opt.value
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: 'Receita',
            value: fmtCurrency(summary.totalRevenue),
            Icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Despesa',
            value: fmtCurrency(summary.totalExpense),
            Icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
          {
            label: 'Lucro',
            value: fmtCurrency(summary.profit),
            Icon: DollarSign,
            color: summary.profit >= 0 ? 'text-zinc-100' : 'text-red-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Agendamentos',
            value: summary.appointments,
            Icon: CalendarCheck,
            color: 'text-zinc-100',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Novos clientes',
            value: summary.newClients,
            Icon: Users,
            color: 'text-zinc-100',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Ticket médio',
            value: fmtCurrency(summary.avgTicket),
            Icon: Target,
            color: 'text-zinc-100',
            bg: 'bg-zinc-700/50',
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-2">
            <div className={`rounded-lg p-1.5 ${bg} shrink-0`}>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 mb-0.5">{label}</p>
              <p className={`text-sm font-bold truncate ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Receita por barbeiro */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Receita por Barbeiro</h3>
          {barberStats.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum dado no período</p>
          ) : (
            <div className="space-y-3">
              {barberStats.map((b) => (
                <div key={b.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-200">{b.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-400">{fmtCurrency(b.revenue)}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">{b.count} serv.</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${(b.revenue / maxBarberRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Serviços mais populares */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Serviços Mais Populares</h3>
          {serviceStats.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum dado no período</p>
          ) : (
            <div className="space-y-3">
              {serviceStats.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-200">{s.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-100">{s.count}×</span>
                      <span className="text-[10px] text-zinc-500 ml-2">{fmtCurrency(s.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(s.count / maxServiceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status dos agendamentos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Status dos Agendamentos</h3>
          {totalAppt === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum agendamento no período</p>
          ) : (
            <>
              <div className="flex h-4 rounded-full overflow-hidden mb-4">
                {Object.entries(statusCount).map(([status, count]) =>
                  count > 0 ? (
                    <div
                      key={status}
                      className={`${STATUS_COLOR[status] ?? 'bg-zinc-500'} transition-all`}
                      style={{ width: `${(count / totalAppt) * 100}%` }}
                      title={`${STATUS_LABEL[status]}: ${count}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(statusCount).map(([status, count]) =>
                  count > 0 ? (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-sm ${STATUS_COLOR[status] ?? 'bg-zinc-500'}`} />
                        <span className="text-xs text-zinc-400">{STATUS_LABEL[status] ?? status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-100">{count}</span>
                        <span className="text-[10px] text-zinc-500">{fmtPct(count, totalAppt)}</span>
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </>
          )}
        </div>

        {/* Receita por forma de pagamento */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Receita por Forma de Pagamento</h3>
          {paymentStats.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum dado no período</p>
          ) : (
            <div className="space-y-3">
              {paymentStats.map((p) => {
                const maxPay = paymentStats[0]?.total ?? 1
                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-200">
                        {PAYMENT_LABELS[p.method] ?? p.method}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-400">{fmtCurrency(p.total)}</span>
                        <span className="text-[10px] text-zinc-500">
                          {fmtPct(p.total, summary.totalRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${(p.total / maxPay) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* DRE — Demonstração de Resultado */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-100">
            DRE — Demonstração de Resultado
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Visão simplificada de receitas e despesas cadastradas no período
          </p>
        </div>

        <div className="p-5 space-y-6">
          {/* Resumo principal — 3 cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">Receita Bruta</span>
              </div>
              <p className="text-xl font-bold text-green-400">{fmtCurrency(dre.grossRevenue)}</p>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-4 w-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Total Despesas</span>
              </div>
              <p className="text-xl font-bold text-red-400">{fmtCurrency(dre.totalDirectExpenses)}</p>
            </div>

            <div
              className={[
                'rounded-lg border p-4',
                dre.netProfit >= 0
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-red-500/20 bg-red-500/5',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent
                  className={`h-4 w-4 ${dre.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}
                />
                <span
                  className={`text-xs font-medium ${dre.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}
                >
                  Lucro Líquido
                </span>
              </div>
              <p
                className={`text-xl font-bold ${dre.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}
              >
                {fmtCurrency(dre.netProfit)}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Margem: {dre.margin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Barra receita vs despesa */}
          {(dre.grossRevenue > 0 || dre.totalDirectExpenses > 0) && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-500">
                <span>Receita</span>
                <span>Despesas</span>
              </div>
              <div className="h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                {dre.grossRevenue > 0 && (
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(dre.grossRevenue / (dre.grossRevenue + dre.totalDirectExpenses)) * 100}%`,
                    }}
                  />
                )}
                {dre.totalDirectExpenses > 0 && (
                  <div className="h-full bg-red-500 flex-1 transition-all" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-green-400">
                  {fmtPct(dre.grossRevenue, dre.grossRevenue + dre.totalDirectExpenses)}
                </span>
                <span className="text-red-400">
                  {fmtPct(dre.totalDirectExpenses, dre.grossRevenue + dre.totalDirectExpenses)}
                </span>
              </div>
            </div>
          )}

          {/* Despesas por categoria */}
          {dre.expensesByCategory.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                Despesas por Categoria
              </h4>
              <div className="space-y-2.5">
                {dre.expensesByCategory.map((e) => (
                  <div key={e.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-300">{e.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-400">{fmtCurrency(e.total)}</span>
                        <span className="text-[10px] text-zinc-500">
                          {fmtPct(e.total, dre.totalDirectExpenses)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500/70 transition-all"
                        style={{ width: `${(e.total / maxExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-4">
              Nenhuma despesa registrada no período.{' '}
              <a href="/dashboard/despesas" className="text-amber-400 hover:underline">
                Cadastrar despesas
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
