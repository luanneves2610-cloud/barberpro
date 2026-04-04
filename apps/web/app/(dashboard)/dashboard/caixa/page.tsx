import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { CaixaClient } from './caixa-client'

export const metadata: Metadata = { title: 'Caixa do Dia' }

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  // Parse selected date (default: today)
  const selectedDate = searchParams.date
    ? new Date(searchParams.date + 'T00:00:00')
    : new Date(new Date().toDateString())

  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + 1)

  // Fetch all appointments for the day (all statuses)
  const appointments = await prisma.appointment.findMany({
    where: {
      tenant_id: tenantId,
      date: { gte: selectedDate, lt: nextDate },
    },
    include: {
      barber: { select: { id: true, name: true, commission_pct: true } },
      service: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: [{ start_time: 'asc' }],
  })

  // Aggregate metrics
  const completed = appointments.filter((a) => a.status === 'COMPLETED')
  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED')
  const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS')
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED')

  const totalRevenue = completed.reduce((sum, a) => sum + Number(a.price), 0)
  const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0

  // Revenue by payment method
  const paymentMap = new Map<string, number>()
  for (const a of completed) {
    const method = a.payment_method ?? 'PENDING'
    paymentMap.set(method, (paymentMap.get(method) ?? 0) + Number(a.price))
  }
  const byPayment = Array.from(paymentMap.entries())
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Revenue + commission by barber (completed only)
  const barberMap = new Map<string, {
    id: string; name: string; commissionPct: number
    revenue: number; commission: number; count: number
  }>()
  for (const a of completed) {
    const b = a.barber
    const price = Number(a.price)
    const pct = Number(b.commission_pct)
    if (!barberMap.has(b.id)) {
      barberMap.set(b.id, { id: b.id, name: b.name, commissionPct: pct, revenue: 0, commission: 0, count: 0 })
    }
    const entry = barberMap.get(b.id)!
    entry.revenue += price
    entry.commission += (price * pct) / 100
    entry.count++
  }
  const byBarber = Array.from(barberMap.values()).sort((a, b) => b.revenue - a.revenue)

  // Appointment list for the timeline
  const apptList = appointments.map((a) => ({
    id: a.id,
    startTime: a.start_time,
    endTime: a.end_time,
    status: a.status,
    clientName: a.client.name,
    barberName: a.barber.name,
    serviceName: a.service.name,
    price: Number(a.price),
    paymentMethod: a.payment_method,
  }))

  const dateStr = selectedDate.toISOString().slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Caixa do Dia"
        description="Resumo financeiro e operacional do dia"
      />
      <CaixaClient
        date={dateStr}
        metrics={{
          totalRevenue,
          avgTicket,
          completedCount: completed.length,
          scheduledCount: scheduled.length,
          inProgressCount: inProgress.length,
          cancelledCount: cancelled.length,
          totalCount: appointments.length,
        }}
        byPayment={byPayment}
        byBarber={byBarber}
        appointments={apptList}
      />
    </div>
  )
}
