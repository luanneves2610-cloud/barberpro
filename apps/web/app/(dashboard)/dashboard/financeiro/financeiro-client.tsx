'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Plus, Trash2,
  TrendingUp, TrendingDown, DollarSign, Target, Download,
} from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { TransactionForm } from './transaction-form'
import { deleteTransaction } from '@/lib/actions/transactions'

type Tx = {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string | null
  description: string | null
  amount: number
  payment_method: string | null
  date: string
  appointment_id: string | null
}

type ChartMonth = { label: string; income: number; expense: number }

interface Props {
  transactions: Tx[]
  metrics: { income: number; expense: number; profit: number; avgTicket: number }
  chartData: ChartMonth[]
  year: number
  month: number
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CASH: 'Dinheiro', CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito',
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function FinanceiroClient({ transactions, metrics, chartData, year, month }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [isPending, startTransition] = useTransition()

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/financeiro?year=${y}&month=${m}`)
  }

  const maxVal = Math.max(...chartData.map((m) => Math.max(m.income, m.expense)), 1)
  const filtered = transactions.filter((t) => filter === 'ALL' || t.type === filter)

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  return (
    <>
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[160px] text-center font-semibold text-zinc-100">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/financeiro?year=${year}&month=${month}`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova transação
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Receitas', value: fmtCurrency(metrics.income),
            color: 'text-green-400', Icon: TrendingUp, iconColor: 'text-green-400', bg: 'bg-green-500/10',
          },
          {
            label: 'Despesas', value: fmtCurrency(metrics.expense),
            color: 'text-red-400', Icon: TrendingDown, iconColor: 'text-red-400', bg: 'bg-red-500/10',
          },
          {
            label: 'Lucro líquido', value: fmtCurrency(metrics.profit),
            color: metrics.profit >= 0 ? 'text-zinc-100' : 'text-red-400',
            Icon: DollarSign, iconColor: 'text-amber-400', bg: 'bg-amber-500/10',
          },
          {
            label: 'Ticket médio', value: fmtCurrency(metrics.avgTicket),
            color: 'text-zinc-100', Icon: Target, iconColor: 'text-blue-400', bg: 'bg-blue-500/10',
          },
        ].map(({ label, value, color, Icon, iconColor, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${bg} shrink-0`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-400 mb-1">{label}</p>
              <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart — últimos 6 meses */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-5">Receitas × Despesas — Últimos 6 meses</h3>
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {chartData.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 112 }}>
                <div
                  className="flex-1 bg-green-500/60 hover:bg-green-500/80 rounded-t transition-all"
                  style={{ height: `${Math.max((m.income / maxVal) * 100, 2)}%` }}
                  title={`Receitas: ${fmtCurrency(m.income)}`}
                />
                <div
                  className="flex-1 bg-red-500/60 hover:bg-red-500/80 rounded-t transition-all"
                  style={{ height: `${Math.max((m.expense / maxVal) * 100, 2)}%` }}
                  title={`Despesas: ${fmtCurrency(m.expense)}`}
                />
              </div>
              <p className="text-[10px] text-zinc-500 capitalize whitespace-nowrap">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-green-500/60" />
            <span className="text-xs text-zinc-400">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-red-500/60" />
            <span className="text-xs text-zinc-400">Despesas</span>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Filter tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                filter === f
                  ? 'text-amber-400 border-amber-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100',
              ].join(' ')}
            >
              {f === 'ALL' ? 'Todos' : f === 'INCOME' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
          <div className="ml-auto flex items-center px-4 text-xs text-zinc-500">
            {filtered.length} lançamento(s)
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-zinc-900/50 p-12 text-center">
            <DollarSign className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-400">Nenhuma transação neste período</p>
            <Button size="sm" className="mt-4" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Pagamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Valor</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-400">{fmtDay(t.date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                        t.type === 'INCOME'
                          ? 'bg-green-500/15 text-green-400 ring-green-500/30'
                          : 'bg-red-500/15 text-red-400 ring-red-500/30',
                      ].join(' ')}
                    >
                      {t.category ?? (t.type === 'INCOME' ? 'Receita' : 'Despesa')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400 hidden md:table-cell">
                    {t.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400 hidden sm:table-cell">
                    {t.payment_method ? (PAYMENT_LABELS[t.payment_method] ?? t.payment_method) : '—'}
                  </td>
                  <td
                    className={[
                      'px-4 py-3 text-sm font-medium',
                      t.type === 'INCOME' ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}
                  >
                    {t.type === 'INCOME' ? '+' : '−'} {fmtCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!t.appointment_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Excluir"
                        loading={isPending}
                        onClick={() => startTransition(() => deleteTransaction(t.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova transação">
        <TransactionForm onSuccess={() => setModalOpen(false)} defaultDate={defaultDate} />
      </Modal>
    </>
  )
}
