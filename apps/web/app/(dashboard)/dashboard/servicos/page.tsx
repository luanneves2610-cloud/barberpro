import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { ServicosClient } from './servicos-client'
import type { Service } from '@barberpro/types'

export const metadata: Metadata = { title: 'Serviços' }

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  const [raw, usageRaw] = await Promise.all([
    prisma.service.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.appointment.groupBy({
      by: ['service_id'],
      where: { tenant_id: tenantId, status: 'COMPLETED' },
      _count: { id: true },
      _sum: { price: true },
    }),
  ])

  // Map usage stats by service_id
  const usageMap = new Map(
    usageRaw.map((u) => [u.service_id, { count: u._count.id, revenue: Number(u._sum.price ?? 0) }])
  )

  const services: (Service & { usageCount: number; revenue: number })[] = raw.map((s) => {
    const usage = usageMap.get(s.id) ?? { count: 0, revenue: 0 }
    return {
      ...s,
      description: s.description ?? null,
      icon: s.icon ?? null,
      price: Number(s.price),
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
      usageCount: usage.count,
      revenue: usage.revenue,
    }
  })

  // Sort: active first, then by usage count desc
  services.sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    return b.usageCount - a.usageCount
  })

  const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0)
  const totalUsage = services.reduce((sum, s) => sum + s.usageCount, 0)
  const activeCount = services.filter((s) => s.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Serviços" description="Gerencie os serviços oferecidos pela barbearia" />
      <ServicosClient
        services={services}
        metrics={{ totalRevenue, totalUsage, activeCount, totalCount: services.length }}
      />
    </div>
  )
}
