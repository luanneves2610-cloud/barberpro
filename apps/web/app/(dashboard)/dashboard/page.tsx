import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardMetricCard } from '@/components/dashboard/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar } from '@barberpro/ui'
import {
  CalendarDays, Users, TrendingUp, Scissors,
  ArrowRight, Package, AlertTriangle, Cake,
} from 'lucide-react'
import type { AppointmentStatus } from '@barberpro/types'

export const metadata: Metadata = { title: 'Dashboard' }

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    include: { tenant: { select: { monthly_goal: true } } },
  })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id
  const monthlyGoal = profile.tenant?.monthly_goal ? Number(profile.tenant.monthly_goal) : null
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Last 6 months for chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('pt-BR', { month: 'short' }) }
  })

  const [
    todayAppointmentsRaw,
    monthRevenue,
    activeClients,
    totalBarbers,
    lowStockProducts,
    recentTransactions,
    allActiveClients,
    monthlyRevenueRaw,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenant_id: tenantId, date: { gte: todayStart, lt: todayEnd } },
      include: {
        client: { select: { name: true } },
        barber: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { start_time: 'asc' },
    }),
    prisma.transaction.aggregate({
      where: { tenant_id: tenantId, type: 'INCOME', date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.client.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.barber.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.product.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: { id: true, name: true, stock: true, min_stock: true },
    }),
    prisma.transaction.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { id: true, type: true, category: true, description: true, amount: true, date: true },
    }),
    prisma.client.findMany({
      where: { tenant_id: tenantId, is_active: true, birth_date: { not: null } },
      select: { id: true, name: true, phone: true, birth_date: true },
    }),
    prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        type: 'INCOME',
        date: {
          gte: new Date(last6Months[0].year, last6Months[0].month - 1, 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      },
      select: { amount: true, date: true },
    }),
  ])

  // Filter clients with birthdays today or in the next 7 days (ignoring year)
  const birthdayClients = allActiveClients
    .filter((c) => {
      if (!c.birth_date) return false
      const bd = new Date(c.birth_date)
      // Compare month/day across next 7 days
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
        if (bd.getMonth() === checkDate.getMonth() && bd.getDate() === checkDate.getDate()) {
          return true
        }
      }
      return false
    })
    .map((c) => {
      const bd = new Date(c.birth_date!)
      // Find which day (0=today, 1=tomorrow, etc.)
      let daysUntil = 0
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
        if (bd.getMonth() === checkDate.getMonth() && bd.getDate() === checkDate.getDate()) {
          daysUntil = i
          break
        }
      }
      return { ...c, daysUntil }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const todayTotal = todayAppointmentsRaw.length
  const todayCompleted = todayAppointmentsRaw.filter((a) => a.status === 'COMPLETED').length
  const todayRevenue = todayAppointmentsRaw
    .filter((a) => a.status === 'COMPLETED')
    .reduce((s, a) => s + Number(a.price), 0)
  const monthRevenueVal = Number(monthRevenue._sum.amount ?? 0)
  const criticalStock = lowStockProducts.filter((p) => p.stock <= p.min_stock)

  // Build 6-month chart data
  const chartData = last6Months.map(({ year, month, label }) => {
    const total = monthlyRevenueRaw
      .filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((s, t) => s + Number(t.amount), 0)
    return { label, total }
  })
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1 capitalize">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alerta estoque */}
      {criticalStock.length > 0 && (
        <Link
          href="/dashboard/produtos"
          className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">
              {criticalStock.length} produto(s) com estoque baixo ou zerado
            </p>
            <p className="text-xs text-amber-400/70 truncate">
              {criticalStock.map((p) => p.name).join(', ')}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400 shrink-0" />
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Agendamentos hoje"
          value={String(todayTotal)}
          subtitle={`${todayCompleted} concluído(s)`}
          icon={CalendarDays}
          color="amber"
        />
        <DashboardMetricCard
          title="Receita hoje"
          value={fmtCurrency(todayRevenue)}
          subtitle="Serviços concluídos"
          icon={TrendingUp}
          color="green"
        />
        <DashboardMetricCard
          title="Clientes ativos"
          value={String(activeClients)}
          subtitle={`${totalBarbers} barbeiro(s)`}
          icon={Users}
          color="blue"
        />
        <DashboardMetricCard
          title="Receita do mês"
          value={fmtCurrency(monthRevenueVal)}
          subtitle={now.toLocaleDateString('pt-BR', { month: 'long' })}
          icon={Scissors}
          color="purple"
        />
      </div>

      {/* Meta mensal */}
      {monthlyGoal && monthlyGoal > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Meta do mês</p>
              <p className="text-xs text-zinc-500 capitalize mt-0.5">
                {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-100">{fmtCurrency(monthRevenueVal)}</p>
              <p className="text-xs text-zinc-500">de {fmtCurrency(monthlyGoal)}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                monthRevenueVal >= monthlyGoal
                  ? 'bg-green-500'
                  : monthRevenueVal >= monthlyGoal * 0.75
                  ? 'bg-amber-500'
                  : 'bg-amber-500/60',
              ].join(' ')}
              style={{ width: `${Math.min(100, (monthRevenueVal / monthlyGoal) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-zinc-500">
              {((monthRevenueVal / monthlyGoal) * 100).toFixed(0)}% atingido
            </p>
            {monthRevenueVal >= monthlyGoal ? (
              <span className="text-xs font-semibold text-green-400">Meta atingida! 🎉</span>
            ) : (
              <p className="text-xs text-zinc-500">
                Faltam {fmtCurrency(monthlyGoal - monthRevenueVal)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gráfico receita 6 meses */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Receita — últimos 6 meses</p>
            <p className="text-xs text-zinc-500 mt-0.5">Receitas de serviços e produtos</p>
          </div>
          <Link
            href="/dashboard/relatorios"
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver relatórios <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map(({ label, total }, i) => {
            const heightPct = maxChartValue > 0 ? (total / maxChartValue) * 100 : 0
            const isCurrent = i === chartData.length - 1
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-medium">
                  {total > 0 ? `${(total / 1000).toFixed(1)}k` : '—'}
                </span>
                <div className="relative w-full flex items-end" style={{ height: '72px' }}>
                  <div
                    className={[
                      'w-full rounded-t-md transition-all',
                      isCurrent ? 'bg-amber-500' : 'bg-zinc-700 hover:bg-zinc-600',
                    ].join(' ')}
                    style={{ height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%` }}
                    title={fmtCurrency(total)}
                  />
                </div>
                <span className={['text-[10px] capitalize', isCurrent ? 'text-amber-400 font-semibold' : 'text-zinc-500'].join(' ')}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Aniversariantes */}
      {birthdayClients.length > 0 && (
        <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="h-4 w-4 text-pink-400 shrink-0" />
            <h2 className="text-sm font-semibold text-pink-300">
              Aniversariantes da semana
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {birthdayClients.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-pink-500/20 bg-zinc-900 px-3 py-2"
              >
                <Avatar name={c.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                  <p className="text-[11px] text-pink-400">
                    {c.daysUntil === 0
                      ? '🎂 Hoje!'
                      : c.daysUntil === 1
                      ? 'Amanhã'
                      : `Em ${c.daysUntil} dias`}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agenda do dia */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Agenda de Hoje</h2>
            <Link
              href="/dashboard/agenda"
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-y-auto max-h-72">
            {todayAppointmentsRaw.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarDays className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Nenhum agendamento hoje</p>
                <Link href="/dashboard/agenda" className="text-xs text-amber-400 mt-1 hover:underline">
                  Criar agendamento →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {todayAppointmentsRaw.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="text-center min-w-[42px]">
                      <p className="text-xs font-bold text-zinc-100">{a.start_time}</p>
                      <p className="text-[10px] text-zinc-600">{a.end_time}</p>
                    </div>
                    <Avatar name={a.client.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{a.client.name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {a.service.name} · {a.barber.name}
                      </p>
                    </div>
                    <StatusBadge status={a.status as AppointmentStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transações recentes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Últimas Transações</h2>
            <Link
              href="/dashboard/financeiro"
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-y-auto max-h-72">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <TrendingUp className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Nenhuma transação ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={[
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                        t.type === 'INCOME'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-red-500/15 text-red-400',
                      ].join(' ')}>
                        {t.type === 'INCOME' ? '+' : '−'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {t.description ?? t.category ?? (t.type === 'INCOME' ? 'Receita' : 'Despesa')}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={[
                      'text-sm font-semibold shrink-0 ml-3',
                      t.type === 'INCOME' ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}>
                      {fmtCurrency(Number(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/dashboard/agenda', label: 'Novo agendamento', Icon: CalendarDays, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { href: '/dashboard/clientes', label: 'Novo cliente', Icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { href: '/dashboard/financeiro', label: 'Lançar transação', Icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { href: '/dashboard/produtos', label: 'Ver estoque', Icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ href, label, Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors text-center group"
          >
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
