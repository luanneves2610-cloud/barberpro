import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { FinanceiroClient } from './financeiro-client'

export const metadata: Metadata = { title: 'Financeiro' }

function buildChartData(
  transactions: { type: string; amount: unknown; date: Date }[],
  now: Date,
) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const month = transactions.filter((t) => {
      const td = new Date(t.date)
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
    })
    return {
      label,
      income: month.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0),
      expense: month.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0),
    }
  })
}

export default async function FinanceiroPage({
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
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [monthTransactionsRaw, chartTransactionsRaw] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenant_id: tenantId, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { tenant_id: tenantId, date: { gte: sixMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
  ])

  const transactions = monthTransactionsRaw.map((t) => ({
    id: t.id,
    tenant_id: t.tenant_id,
    appointment_id: t.appointment_id ?? null,
    type: t.type as 'INCOME' | 'EXPENSE',
    category: t.category ?? null,
    description: t.description ?? null,
    amount: Number(t.amount),
    payment_method: t.payment_method ?? null,
    date: t.date.toISOString(),
    created_at: t.created_at.toISOString(),
  }))

  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const incomeCount = transactions.filter((t) => t.type === 'INCOME').length

  const metrics = {
    income,
    expense,
    profit: income - expense,
    avgTicket: incomeCount > 0 ? income / incomeCount : 0,
  }

  const chartData = buildChartData(chartTransactionsRaw, now)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Financeiro" description="Controle de receitas e despesas" />
      <FinanceiroClient
        transactions={transactions}
        metrics={metrics}
        chartData={chartData}
        year={year}
        month={month}
      />
    </div>
  )
}
