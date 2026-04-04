import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ComissoesClient } from './comissoes-client'

export const metadata: Metadata = { title: 'Comissões' }

export default async function ComissoesPage({
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
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year = Number(searchParams.year ?? now.getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  // Completed appointments for the period
  const appointments = await prisma.appointment.findMany({
    where: {
      tenant_id: tenantId,
      status: 'COMPLETED',
      date: { gte: startDate, lt: endDate },
    },
    include: {
      barber: { select: { id: true, name: true, commission_pct: true } },
      service: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: [{ barber_id: 'asc' }, { date: 'asc' }],
  })

  // Group by barber
  const barberMap = new Map<string, {
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
  }>()

  for (const appt of appointments) {
    const b = appt.barber
    const price = Number(appt.price)
    const pct = Number(b.commission_pct)
    const commission = (price * pct) / 100

    if (!barberMap.has(b.id)) {
      barberMap.set(b.id, {
        id: b.id,
        name: b.name,
        commission_pct: pct,
        appointments: [],
        totalRevenue: 0,
        totalCommission: 0,
      })
    }

    const entry = barberMap.get(b.id)!
    entry.appointments.push({
      id: appt.id,
      date: appt.date.toLocaleDateString('pt-BR'),
      clientName: appt.client.name,
      serviceName: appt.service.name,
      price,
      commission,
    })
    entry.totalRevenue += price
    entry.totalCommission += commission
  }

  const barbers = Array.from(barberMap.values()).sort(
    (a, b) => b.totalCommission - a.totalCommission,
  )

  const totalRevenue = barbers.reduce((s, b) => s + b.totalRevenue, 0)
  const totalCommission = barbers.reduce((s, b) => s + b.totalCommission, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Comissões" description="Relatório de comissões por barbeiro" />
      <ComissoesClient
        barbers={barbers}
        totalRevenue={totalRevenue}
        totalCommission={totalCommission}
        month={month}
        year={year}
      />
    </div>
  )
}
