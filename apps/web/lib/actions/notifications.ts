'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'

async function getProfileAndTenant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile
}

export async function markNotificationAsRead(id: string) {
  const profile = await getProfileAndTenant()
  await prisma.notification.updateMany({
    where: { id, tenant_id: profile.tenant_id },
    data: { is_read: true },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notificacoes')
}

export async function markAllNotificationsAsRead() {
  const profile = await getProfileAndTenant()
  await prisma.notification.updateMany({
    where: { tenant_id: profile.tenant_id, is_read: false },
    data: { is_read: true },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notificacoes')
}

export async function deleteNotification(id: string) {
  const profile = await getProfileAndTenant()
  await prisma.notification.deleteMany({
    where: { id, tenant_id: profile.tenant_id },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notificacoes')
}

export async function deleteAllReadNotifications() {
  const profile = await getProfileAndTenant()
  await prisma.notification.deleteMany({
    where: { tenant_id: profile.tenant_id, is_read: true },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notificacoes')
}
