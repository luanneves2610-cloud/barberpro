'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronLeft, ChevronRight, TrendingDown, Download } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { deleteExpense } from '@/lib/actions/expenses'
import { ExpenseForm } from './expense-form'

type Expense = {
  id: string; category: string; description: string
  amount: number; date: string; created_at: string
}

interface Props {
  expenses: Expense[]
  byCategory: { category: string; total: number }[]
  total: number
  year: number
  month: number
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DespesasClient({ expenses, byCategory, total, year, month }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/despesas?year=${y}&month=${m}`)
  }

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const maxCat = byCategory[0]?.total ?? 1

  return (
    <>
      {/* Navegação de mês */}
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
            href={`/api/export/despesas?year=${year}&month=${month}`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova despesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Total + categorias */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total do mês</p>
                <p className="text-xl font-bold text-red-400">{fmtCurrency(total)}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">{expenses.length} lançamento(s)</p>
          </div>

          {/* Por categoria */}
          {byCategory.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Por categoria</h3>
              <div className="space-y-3">
                {byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-300">{c.category}</span>
                      <span className="text-xs font-medium text-red-400">{fmtCurrency(c.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500/60"
                        style={{ width: `${(c.total / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabela */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 overflow-hidden">
          {expenses.length === 0 ? (
            <div className="bg-zinc-900 py-16 text-center">
              <TrendingDown className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400">Nenhuma despesa neste mês</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Valor</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 hidden sm:table-cell">
                      {e.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-red-400">
                      {fmtCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={isPending}
                        onClick={() => startTransition(() => deleteExpense(e.id))}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova despesa" size="sm">
        <ExpenseForm onSuccess={() => setModalOpen(false)} defaultDate={defaultDate} />
      </Modal>
    </>
  )
}
