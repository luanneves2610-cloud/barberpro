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

const BreakSchema = z.object({
  barber_id: z.string().min(1),
  date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  reason: z.string().optional(),
})

export async function createBarberBreak(formData: FormData) {
  const tenantId = await getTenantId()
  const data = BreakSchema.parse(Object.fromEntries(formData))

  // Verify barber belongs to tenant
  const barber = await prisma.barber.findUnique({
    where: { id: data.barber_id, tenant_id: tenantId },
  })
  if (!barber) throw new Error('Barbeiro não encontrado')

  await prisma.barberBreak.create({
    data: {
      tenant_id: tenantId,
      barber_id: data.barber_id,
      date: new Date(data.date + 'T12:00:00'),
      start_time: data.start_time,
      end_time: data.end_time,
      reason: data.reason || null,
    },
  })

  revalidatePath('/dashboard/agenda')
}

export async function deleteBarberBreak(id: string) {
  const tenantId = await getTenantId()
  await prisma.barberBreak.delete({ where: { id, tenant_id: tenantId } })
  revalidatePath('/dashboard/agenda')
}
