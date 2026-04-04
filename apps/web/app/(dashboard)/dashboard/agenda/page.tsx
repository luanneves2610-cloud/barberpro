import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { AgendaShell } from './agenda-shell'
import type { Barber, Service, Client } from '@barberpro/types'

export const metadata: Metadata = { title: 'Agenda' }

export default async function AgendaPage({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  const dateStr = searchParams.date ?? new Date().toISOString().slice(0, 10)
  const dateObj = new Date(dateStr + 'T12:00:00')

  const [appointmentsRaw, barbersRaw, servicesRaw, clientsRaw, productsRaw, breaksRaw] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenant_id: tenantId, date: dateObj },
      include: { client: true, barber: true, service: true },
      orderBy: { start_time: 'asc' },
    }),
    prisma.barber.findMany({ where: { tenant_id: tenantId, is_active: true }, orderBy: { name: 'asc' } }),
    prisma.service.findMany({ where: { tenant_id: tenantId, is_active: true }, orderBy: { name: 'asc' } }),
    prisma.client.findMany({ where: { tenant_id: tenantId, is_active: true }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { tenant_id: tenantId, is_active: true, stock: { gt: 0 } }, orderBy: { name: 'asc' } }),
    prisma.barberBreak.findMany({ where: { tenant_id: tenantId, date: dateObj }, orderBy: { start_time: 'asc' } }),
  ])

  const appointments = appointmentsRaw.map((a) => ({
    id: a.id, tenant_id: a.tenant_id,
    client_id: a.client_id, barber_id: a.barber_id, service_id: a.service_id,
    date: a.date.toISOString(), start_time: a.start_time, end_time: a.end_time,
    status: a.status, payment_method: a.payment_method ?? null,
    payment_status: a.payment_status, price: Number(a.price),
    notes: a.notes ?? null,
    recurrence_group_id: a.recurrence_group_id ?? null,
    confirmed_at: a.confirmed_at?.toISOString() ?? null,
    created_at: a.created_at.toISOString(), updated_at: a.updated_at.toISOString(),
    client: {
      ...a.client, email: a.client.email ?? null, phone: a.client.phone ?? null,
      birth_date: a.client.birth_date?.toISOString() ?? null, avatar_url: a.client.avatar_url ?? null,
      notes: a.client.notes ?? null, user_id: a.client.user_id ?? null,
      created_at: a.client.created_at.toISOString(), updated_at: a.client.updated_at.toISOString(),
    },
    barber: {
      ...a.barber, email: a.barber.email ?? null, phone: a.barber.phone ?? null,
      avatar_url: a.barber.avatar_url ?? null, bio: a.barber.bio ?? null,
      commission_pct: Number(a.barber.commission_pct), rating: Number(a.barber.rating),
      created_at: a.barber.created_at.toISOString(), updated_at: a.barber.updated_at.toISOString(),
    },
    service: {
      ...a.service, description: a.service.description ?? null, icon: a.service.icon ?? null,
      price: Number(a.service.price), created_at: a.service.created_at.toISOString(),
      updated_at: a.service.updated_at.toISOString(),
    },
  }))

  const barbers: Barber[] = barbersRaw.map((b) => ({
    ...b, email: b.email ?? null, phone: b.phone ?? null, avatar_url: b.avatar_url ?? null,
    bio: b.bio ?? null, commission_pct: Number(b.commission_pct), rating: Number(b.rating),
    created_at: b.created_at.toISOString(), updated_at: b.updated_at.toISOString(),
  }))

  const services: Service[] = servicesRaw.map((s) => ({
    ...s, description: s.description ?? null, icon: s.icon ?? null, price: Number(s.price),
    created_at: s.created_at.toISOString(), updated_at: s.updated_at.toISOString(),
  }))

  const clients: Client[] = clientsRaw.map((c) => ({
    ...c, email: c.email ?? null, phone: c.phone ?? null,
    birth_date: c.birth_date?.toISOString() ?? null, avatar_url: c.avatar_url ?? null,
    notes: c.notes ?? null, user_id: c.user_id ?? null,
    created_at: c.created_at.toISOString(), updated_at: c.updated_at.toISOString(),
  }))

  const products = productsRaw.map((p) => ({
    id: p.id, name: p.name, price: Number(p.price), stock: p.stock, category: p.category ?? null,
  }))

  const breaks = breaksRaw.map((br) => ({
    id: br.id,
    barber_id: br.barber_id,
    start_time: br.start_time,
    end_time: br.end_time,
    reason: br.reason ?? null,
  }))

  const metrics = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
    revenue: appointments.filter((a) => a.status === 'COMPLETED').reduce((s, a) => s + Number(a.price), 0),
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Gerencie os agendamentos do dia" />
      <AgendaShell
        appointments={appointments as any}
        barbers={barbers}
        services={services}
        clients={clients}
        products={products}
        breaks={breaks}
        date={dateStr}
        metrics={metrics}
      />
    </div>
  )
}
