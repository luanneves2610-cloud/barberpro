'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import type { Plan, TenantStatus } from '@barberpro/types'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile || profile.role !== 'SUPER_ADMIN') throw new Error('Acesso negado')
  return profile
}

export async function updateTenantAdmin(tenantId: string, field: string, value: string) {
  await assertSuperAdmin()

  if (field === 'plan') {
    const validPlans: Plan[] = ['BASIC', 'PRO', 'ENTERPRISE']
    if (!validPlans.includes(value as Plan)) throw new Error('Plano inválido')
    await prisma.tenant.update({ where: { id: tenantId }, data: { plan: value as Plan } })
  }

  if (field === 'status') {
    const validStatuses: TenantStatus[] = ['ACTIVE', 'SUSPENDED', 'CANCELLED']
    if (!validStatuses.includes(value as TenantStatus)) throw new Error('Status inválido')
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: value as TenantStatus } })
  }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin')
}

export async function getAdminStats() {
  await assertSuperAdmin()

  const [totalTenants, activeTenants, totalProfiles, totalAppointments] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.profile.count(),
    prisma.appointment.count(),
  ])

  return { totalTenants, activeTenants, totalProfiles, totalAppointments }
}
