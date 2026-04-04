import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { BarbersSection } from './barbers-section'
import { TenantForm } from './tenant-form'
import { SchedulesSection } from './schedules-section'
import { BreaksSection } from './breaks-section'
import type { Barber, Tenant } from '@barberpro/types'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    include: { tenant: true },
  })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  const [barbersRaw, schedulesRaw, breaksRaw] = await Promise.all([
    prisma.barber.findMany({ where: { tenant_id: tenantId }, orderBy: { name: 'asc' } }),
    prisma.barberSchedule.findMany({ where: { tenant_id: tenantId } }),
    prisma.barberBreak.findMany({
      where: { tenant_id: tenantId },
      orderBy: { date: 'desc' },
      take: 60,
    }),
  ])

  const barbers: Barber[] = barbersRaw.map((b) => ({
    id: b.id,
    tenant_id: b.tenant_id,
    name: b.name,
    email: b.email ?? null,
    phone: b.phone ?? null,
    avatar_url: b.avatar_url ?? null,
    bio: b.bio ?? null,
    commission_pct: Number(b.commission_pct),
    rating: Number(b.rating),
    is_active: b.is_active,
    created_at: b.created_at.toISOString(),
    updated_at: b.updated_at.toISOString(),
  }))

  const schedules = schedulesRaw.map((s) => ({
    id: s.id,
    barber_id: s.barber_id,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    is_active: s.is_active,
  }))

  const breaks = breaksRaw.map((b) => ({
    id: b.id,
    barber_id: b.barber_id,
    date: b.date.toISOString().slice(0, 10),
    start_time: b.start_time,
    end_time: b.end_time,
    reason: b.reason ?? null,
  }))

  const t = profile.tenant
  const tenant: Tenant = {
    id: t.id,
    name: t.name,
    slug: t.slug,
    logo_url: t.logo_url ?? null,
    phone: t.phone ?? null,
    address: t.address ?? null,
    city: t.city ?? null,
    state: t.state ?? null,
    plan: t.plan,
    status: t.status,
    monthly_goal: t.monthly_goal ? Number(t.monthly_goal) : null,
    created_at: t.created_at.toISOString(),
    updated_at: t.updated_at.toISOString(),
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Configurações"
        description="Gerencie sua barbearia, equipe e preferências"
      />

      {/* Dados da barbearia */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Dados da Barbearia</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Nome, contato e endereço. Necessário para emissão de NF-e.
        </p>
        <TenantForm tenant={tenant} />
      </div>

      {/* Equipe */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <BarbersSection barbers={barbers} />
      </div>

      {/* Horários de trabalho */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Horários de Trabalho</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Defina os dias e horários de trabalho de cada barbeiro.
        </p>
        <SchedulesSection barbers={barbers} schedules={schedules} />
      </div>

      {/* Folgas e bloqueios */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Folgas e Bloqueios</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Registre folgas, pausas e horários indisponíveis. Esses períodos ficam bloqueados na agenda.
        </p>
        <BreaksSection barbers={barbers} breaks={breaks} />
      </div>
    </div>
  )
}
