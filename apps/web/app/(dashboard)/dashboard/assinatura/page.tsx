import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { AssinaturaClient } from './assinatura-client'
import { PLAN_CONFIG } from '@barberpro/types'

export const metadata: Metadata = { title: 'Assinatura' }

export default async function AssinaturaPage({ searchParams }: { searchParams: { payment?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    include: { tenant: true },
  })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [subscription, barbersCount, monthAppointments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    }),
    prisma.barber.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.appointment.count({
      where: { tenant_id: tenantId, date: { gte: monthStart } },
    }),
  ])

  const plan = profile.tenant.plan
  const planConfig = PLAN_CONFIG[plan]

  const subSerialized = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan as string,
        status: subscription.status as string,
        price: Number(subscription.price),
        billing_cycle: subscription.billing_cycle,
        started_at: subscription.started_at.toISOString(),
        ends_at: subscription.ends_at?.toISOString() ?? null,
        trial_ends_at: subscription.trial_ends_at?.toISOString() ?? null,
      }
    : null

  const usage = {
    barbers: { used: barbersCount, max: planConfig.maxBarbers },
    appointments: { used: monthAppointments, max: planConfig.maxAppointmentsPerMonth },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assinatura" description="Gerencie seu plano e faturamento" />
      <AssinaturaClient
        currentPlan={plan}
        subscription={subSerialized}
        usage={usage}
        paymentStatus={searchParams.payment ?? null}
      />
    </div>
  )
}
