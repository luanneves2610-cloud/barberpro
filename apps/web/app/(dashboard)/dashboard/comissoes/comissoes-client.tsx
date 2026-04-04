'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, Users, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useState } from 'react'

interface BarberStat {
  id: string
  name: string
  commission_pct: number
  appointments: {
    id: string
    date: string
    clientName: string
    serviceName: string
    price: number
    commission: number
  }[]
  totalRevenue: number
  totalCommission: number
}

interface Props {
  barbers: BarberStat[]
  totalRevenue: number
  totalCommission: number
  month: number
  year: number
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm shrink-0">
      {initials}
    </div>
  )
}

export function ComissoesClient({ barbers, totalRevenue, totalCommission, month, year }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/comissoes?month=${m}&year=${y}`)
  }

  const barbeiroShare = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/comissoes?month=${month}&year=${year}`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </a>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-zinc-200 min-w-[130px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Receita bruta',
            value: fmtCurrency(totalRevenue),
            Icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Total comissões',
            value: fmtCurrency(totalCommission),
            Icon: DollarSign,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Lucro líquido (aprox.)',
            value: fmtCurrency(totalRevenue - totalCommission),
            Icon: Users,
            color: 'text-zinc-100',
            bg: 'bg-zinc-700/50',
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${bg} shrink-0`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-400">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barbearia share bar */}
      {totalRevenue > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Distribuição da receita</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-zinc-400">Barbeiros {barbeiroShare.toFixed(0)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                <span className="text-zinc-400">Barbearia {(100 - barbeiroShare).toFixed(0)}%</span>
              </span>
            </div>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
            <div
              className="bg-amber-500 h-full rounded-l-full transition-all"
              style={{ width: `${barbeiroShare}%` }}
            />
          </div>
        </div>
      )}

      {/* Barber list */}
      {barbers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500 text-sm">Nenhum serviço concluído em {MONTHS[month - 1]}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barbers.map((barber) => (
            <div key={barber.id} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              {/* Barber header */}
              <button
                onClick={() => setExpanded(expanded === barber.id ? null : barber.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors text-left"
              >
                <InitialsAvatar name={barber.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">{barber.name}</p>
                  <p className="text-xs text-zinc-500">
                    {barber.commission_pct}% de comissão · {barber.appointments.length} serviço{barber.appointments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-400">{fmtCurrency(barber.totalCommission)}</p>
                  <p className="text-xs text-zinc-500">de {fmtCurrency(barber.totalRevenue)}</p>
                </div>
                {expanded === barber.id
                  ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />}
              </button>

              {/* Appointments detail */}
              {expanded === barber.id && (
                <div className="border-t border-zinc-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Data</th>
                          <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Cliente</th>
                          <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Serviço</th>
                          <th className="px-4 py-2.5 text-right font-medium text-zinc-500">Valor</th>
                          <th className="px-4 py-2.5 text-right font-medium text-zinc-500">Comissão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {barber.appointments.map((a) => (
                          <tr key={a.id} className="hover:bg-zinc-800/30">
                            <td className="px-4 py-2.5 text-zinc-400">{a.date}</td>
                            <td className="px-4 py-2.5 text-zinc-200">{a.clientName}</td>
                            <td className="px-4 py-2.5 text-zinc-400">{a.serviceName}</td>
                            <td className="px-4 py-2.5 text-right text-zinc-200">{fmtCurrency(a.price)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-amber-400">{fmtCurrency(a.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-zinc-700">
                          <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-zinc-400">
                            Total
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-zinc-100">
                            {fmtCurrency(barber.totalRevenue)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-amber-400">
                            {fmtCurrency(barber.totalCommission)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
