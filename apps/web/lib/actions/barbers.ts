'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import { checkBarberLimit } from '@/lib/plan/limits'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const BarberSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  commission_pct: z.coerce.number().min(0).max(100).default(0),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export async function createBarber(formData: FormData) {
  const tenantId = await getTenantId()
  await checkBarberLimit(tenantId)
  const data = BarberSchema.parse(Object.fromEntries(formData))

  await prisma.barber.create({
    data: {
      tenant_id: tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      commission_pct: data.commission_pct,
      bio: data.bio || null,
      avatar_url: data.avatar_url || null,
    },
  })
  revalidatePath('/dashboard/configuracoes')
}

export async function updateBarber(id: string, formData: FormData) {
  const tenantId = await getTenantId()
  const data = BarberSchema.parse(Object.fromEntries(formData))

  await prisma.barber.update({
    where: { id, tenant_id: tenantId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      commission_pct: data.commission_pct,
      bio: data.bio || null,
      avatar_url: data.avatar_url || null,
    },
  })
  revalidatePath('/dashboard/configuracoes')
}

export async function toggleBarberStatus(id: string) {
  const tenantId = await getTenantId()
  const barber = await prisma.barber.findUnique({ where: { id, tenant_id: tenantId } })
  if (!barber) throw new Error('Barbeiro não encontrado')

  await prisma.barber.update({
    where: { id },
    data: { is_active: !barber.is_active },
  })
  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard/agenda')
}

export async function deleteBarber(id: string) {
  const tenantId = await getTenantId()
  await prisma.barber.delete({ where: { id, tenant_id: tenantId } })
  revalidatePath('/dashboard/configuracoes')
}
