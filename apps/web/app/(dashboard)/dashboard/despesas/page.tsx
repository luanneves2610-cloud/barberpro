import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { DespesasClient } from './despesas-client'

export const metadata: Metadata = { title: 'Despesas' }

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id
  const now = new Date()
  const year = Number(searchParams.year ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth() + 1)

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const expensesRaw = await prisma.expense.findMany({
    where: { tenant_id: tenantId, date: { gte: monthStart, lte: monthEnd } },
    orderBy: { date: 'desc' },
  })

  const expenses = expensesRaw.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    date: e.date.toISOString(),
    created_at: e.created_at.toISOString(),
  }))

  // Totais por categoria
  const byCat: Record<string, number> = {}
  for (const e of expenses) {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount
  }
  const byCategory = Object.entries(byCat)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Despesas" description="Controle de gastos e custos fixos" />
      <DespesasClient
        expenses={expenses}
        byCategory={byCategory}
        total={totalExpense}
        year={year}
        month={month}
      />
    </div>
  )
}
