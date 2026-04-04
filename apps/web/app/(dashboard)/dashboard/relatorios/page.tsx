import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { RelatoriosClient } from './relatorios-client'

export const metadata: Metadata = { title: 'Relatórios' }

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id
  const range = searchParams.range ?? '30'
  const days = Number(range)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Busca paralela
  const [appointmentsRaw, transactionsRaw, clientsRaw, expensesRaw] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenant_id: tenantId, date: { gte: since } },
      include: {
        barber: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true } },
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { tenant_id: tenantId, date: { gte: since } },
    }),
    prisma.client.findMany({
      where: { tenant_id: tenantId, created_at: { gte: since } },
      select: { id: true, created_at: true },
    }),
    prisma.expense.findMany({
      where: { tenant_id: tenantId, date: { gte: since } },
      select: { category: true, amount: true },
    }),
  ])

  // 1. Receita por barbeiro
  const barberMap: Record<string, { name: string; revenue: number; count: number; avgTicket: number }> = {}
  for (const a of appointmentsRaw) {
    if (a.status !== 'COMPLETED') continue
    if (!barberMap[a.barber_id]) {
      barberMap[a.barber_id] = { name: a.barber.name, revenue: 0, count: 0, avgTicket: 0 }
    }
    barberMap[a.barber_id].revenue += Number(a.price)
    barberMap[a.barber_id].count++
  }
  const barberStats = Object.values(barberMap)
    .map((b) => ({ ...b, avgTicket: b.count > 0 ? b.revenue / b.count : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  // 2. Serviços mais populares
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const a of appointmentsRaw) {
    if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') continue
    if (!serviceMap[a.service_id]) {
      serviceMap[a.service_id] = { name: a.service.name, count: 0, revenue: 0 }
    }
    serviceMap[a.service_id].count++
    if (a.status === 'COMPLETED') serviceMap[a.service_id].revenue += Number(a.price)
  }
  const serviceStats = Object.values(serviceMap).sort((a, b) => b.count - a.count).slice(0, 8)

  // 3. Agendamentos por status
  const statusCount = {
    SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0,
  } as Record<string, number>
  for (const a of appointmentsRaw) statusCount[a.status] = (statusCount[a.status] ?? 0) + 1

  // 4. Receita por forma de pagamento
  const paymentMap: Record<string, number> = {}
  for (const t of transactionsRaw) {
    if (t.type !== 'INCOME') continue
    const key = t.payment_method ?? 'Não informado'
    paymentMap[key] = (paymentMap[key] ?? 0) + Number(t.amount)
  }
  const paymentStats = Object.entries(paymentMap)
    .map(([method, total]) => ({ method, total }))
    .sort((a, b) => b.total - a.total)

  // 5. Resumo geral
  const totalRevenue = transactionsRaw
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenseFromTransactions = transactionsRaw
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + Number(t.amount), 0)

  const summary = {
    totalRevenue,
    totalExpense: totalExpenseFromTransactions,
    profit: totalRevenue - totalExpenseFromTransactions,
    appointments: appointmentsRaw.length,
    completed: appointmentsRaw.filter((a) => a.status === 'COMPLETED').length,
    newClients: clientsRaw.length,
    avgTicket:
      appointmentsRaw.filter((a) => a.status === 'COMPLETED').length > 0
        ? totalRevenue / appointmentsRaw.filter((a) => a.status === 'COMPLETED').length
        : 0,
  }

  // 6. DRE — despesas por categoria (da tabela Expense)
  const expenseCatMap: Record<string, number> = {}
  for (const e of expensesRaw) {
    expenseCatMap[e.category] = (expenseCatMap[e.category] ?? 0) + Number(e.amount)
  }
  const expensesByCategory = Object.entries(expenseCatMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const totalDirectExpenses = expensesByCategory.reduce((s, e) => s + e.total, 0)
  const grossRevenue = totalRevenue
  const netProfit = grossRevenue - totalDirectExpenses

  const dre = {
    grossRevenue,
    totalDirectExpenses,
    netProfit,
    margin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
    expensesByCategory,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Relatórios" description="Análise detalhada do desempenho da barbearia" />
      <RelatoriosClient
        summary={summary}
        barberStats={barberStats}
        serviceStats={serviceStats}
        statusCount={statusCount}
        paymentStats={paymentStats}
        dre={dre}
        range={range}
      />
    </div>
  )
}
