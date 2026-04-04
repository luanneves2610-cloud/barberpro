import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { MarketingClient } from './marketing-client'

export const metadata: Metadata = { title: 'Marketing' }

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  // Stats for audience size preview
  const [totalWithPhone, last30, last90, inactive] = await Promise.all([
    prisma.client.count({
      where: { tenant_id: tenantId, is_active: true, phone: { not: null } },
    }),
    prisma.appointment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'COMPLETED',
        date: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { client_id: true },
      distinct: ['client_id'],
    }).then((r) => r.length),
    prisma.appointment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'COMPLETED',
        date: { gte: new Date(Date.now() - 90 * 86400000) },
      },
      select: { client_id: true },
      distinct: ['client_id'],
    }).then((r) => r.length),
    prisma.appointment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'COMPLETED',
        date: { lt: new Date(Date.now() - 60 * 86400000) },
      },
      select: { client_id: true },
      distinct: ['client_id'],
    }).then((r) => r.length),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Marketing"
        description="Envie mensagens e campanhas para seus clientes via WhatsApp"
      />
      <MarketingClient
        audienceStats={{ totalWithPhone, last30, last90, inactive }}
      />
    </div>
  )
}
