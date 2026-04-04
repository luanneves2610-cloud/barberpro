'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return { profile, userId: user.id }
}

const ProfileSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export async function updateProfile(formData: FormData) {
  const { profile } = await getProfile()
  const data = ProfileSchema.parse(Object.fromEntries(formData))

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
    },
  })

  revalidatePath('/dashboard/perfil')
  revalidatePath('/dashboard')
}

export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}
