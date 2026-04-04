import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { ClientesClient } from './clientes-client'
import type { Client } from '@barberpro/types'

export const metadata: Metadata = { title: 'Clientes' }

const PAGE_SIZE = 20

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; filter?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const search = searchParams.q ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const filter = searchParams.filter ?? 'active' // active | inactive | all

  const isActiveFilter =
    filter === 'active' ? true : filter === 'inactive' ? false : undefined

  const where = {
    tenant_id: profile.tenant_id,
    ...(isActiveFilter !== undefined ? { is_active: isActiveFilter } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [raw, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { appointments: true } } },
    }),
    prisma.client.count({ where }),
  ])

  const now = new Date()
  function hasBirthdaySoon(birthDate: Date | null): boolean {
    if (!birthDate) return false
    for (let i = 0; i < 7; i++) {
      const check = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
      if (birthDate.getMonth() === check.getMonth() && birthDate.getDate() === check.getDate()) return true
    }
    return false
  }

  const clients: (Client & { totalAppointments: number; birthdaySoon: boolean })[] = raw.map((c) => ({
    id: c.id,
    tenant_id: c.tenant_id,
    user_id: c.user_id ?? null,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    birth_date: c.birth_date ? c.birth_date.toISOString() : null,
    avatar_url: c.avatar_url ?? null,
    notes: c.notes ?? null,
    is_active: c.is_active,
    created_at: c.created_at.toISOString(),
    updated_at: c.updated_at.toISOString(),
    totalAppointments: c._count.appointments,
    birthdaySoon: hasBirthdaySoon(c.birth_date),
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        description={`${total} cliente(s)${search ? ` para "${search}"` : ''}`}
      />
      <ClientesClient
        clients={clients}
        initialSearch={search}
        initialFilter={filter}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  )
}
