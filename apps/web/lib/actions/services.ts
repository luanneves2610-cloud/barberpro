'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const ServiceSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Duração mínima 5 min').max(480),
  price: z.coerce.number().min(0, 'Preço inválido'),
  icon: z.string().optional(),
})

export async function createService(formData: FormData) {
  const tenantId = await getTenantId()
  const data = ServiceSchema.parse(Object.fromEntries(formData))

  await prisma.service.create({
    data: {
      tenant_id: tenantId,
      name: data.name,
      description: data.description || null,
      duration: data.duration,
      price: data.price,
      icon: data.icon || null,
    },
  })
  revalidatePath('/dashboard/servicos')
}

export async function updateService(id: string, formData: FormData) {
  const tenantId = await getTenantId()
  const data = ServiceSchema.parse(Object.fromEntries(formData))

  await prisma.service.update({
    where: { id, tenant_id: tenantId },
    data: {
      name: data.name,
      description: data.description || null,
      duration: data.duration,
      price: data.price,
      icon: data.icon || null,
    },
  })
  revalidatePath('/dashboard/servicos')
}

export async function toggleServiceStatus(id: string) {
  const tenantId = await getTenantId()
  const service = await prisma.service.findUnique({ where: { id, tenant_id: tenantId } })
  if (!service) throw new Error('Serviço não encontrado')

  await prisma.service.update({
    where: { id },
    data: { is_active: !service.is_active },
  })
  revalidatePath('/dashboard/servicos')
  revalidatePath('/dashboard/agenda')
}

export async function deleteService(id: string) {
  const tenantId = await getTenantId()
  await prisma.service.delete({ where: { id, tenant_id: tenantId } })
  revalidatePath('/dashboard/servicos')
}

export async function duplicateService(id: string) {
  const tenantId = await getTenantId()
  const original = await prisma.service.findUnique({ where: { id, tenant_id: tenantId } })
  if (!original) throw new Error('Serviço não encontrado')

  await prisma.service.create({
    data: {
      tenant_id: tenantId,
      name: `${original.name} (cópia)`,
      description: original.description,
      duration: original.duration,
      price: original.price,
      icon: original.icon,
      is_active: false, // starts inactive so the user can review before activating
    },
  })
  revalidatePath('/dashboard/servicos')
}
