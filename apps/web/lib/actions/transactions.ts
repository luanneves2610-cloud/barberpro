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

const TransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Categoria obrigatória'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  payment_method: z.enum(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']).optional(),
  date: z.string().min(1, 'Data obrigatória'),
})

export async function createTransaction(formData: FormData) {
  const tenantId = await getTenantId()
  const data = TransactionSchema.parse(Object.fromEntries(formData))

  await prisma.transaction.create({
    data: {
      tenant_id: tenantId,
      type: data.type,
      category: data.category,
      description: data.description || null,
      amount: data.amount,
      payment_method: data.payment_method ?? null,
      date: new Date(data.date + 'T12:00:00'),
    },
  })

  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
}

export async function deleteTransaction(id: string) {
  const tenantId = await getTenantId()
  await prisma.transaction.delete({ where: { id, tenant_id: tenantId } })
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
}
