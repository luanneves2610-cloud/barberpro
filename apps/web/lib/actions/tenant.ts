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

const TenantSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  monthly_goal: z.coerce.number().min(0).optional(),
})

export async function updateTenant(formData: FormData) {
  const tenantId = await getTenantId()
  const data = TenantSchema.parse(Object.fromEntries(formData))

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      logo_url: data.logo_url || null,
      monthly_goal: data.monthly_goal || null,
    },
  })

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard')
}

const ScheduleSchema = z.object({
  barber_id: z.string().min(1),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
})

export async function upsertBarberSchedule(formData: FormData) {
  const tenantId = await getTenantId()
  const data = ScheduleSchema.parse(Object.fromEntries(formData))

  await prisma.barberSchedule.upsert({
    where: {
      barber_id_day_of_week: {
        barber_id: data.barber_id,
        day_of_week: data.day_of_week,
      },
    },
    update: {
      start_time: data.start_time,
      end_time: data.end_time,
      is_active: true,
    },
    create: {
      tenant_id: tenantId,
      barber_id: data.barber_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
    },
  })

  revalidatePath('/dashboard/configuracoes')
}

export async function toggleBarberScheduleDay(barberId: string, dayOfWeek: number) {
  const tenantId = await getTenantId()

  const schedule = await prisma.barberSchedule.findUnique({
    where: { barber_id_day_of_week: { barber_id: barberId, day_of_week: dayOfWeek } },
  })

  if (schedule) {
    await prisma.barberSchedule.update({
      where: { barber_id_day_of_week: { barber_id: barberId, day_of_week: dayOfWeek } },
      data: { is_active: !schedule.is_active },
    })
  } else {
    await prisma.barberSchedule.create({
      data: {
        tenant_id: tenantId,
        barber_id: barberId,
        day_of_week: dayOfWeek,
        start_time: '08:00',
        end_time: '18:00',
      },
    })
  }

  revalidatePath('/dashboard/configuracoes')
}
