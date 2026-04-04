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

const ExpenseSchema = z.object({
  category: z.string().min(1, 'Categoria obrigatória'),
  description: z.string().min(2, 'Descrição obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data obrigatória'),
})

export async function createExpense(formData: FormData) {
  const tenantId = await getTenantId()
  const data = ExpenseSchema.parse(Object.fromEntries(formData))

  // Cria na tabela expenses
  await prisma.expense.create({
    data: {
      tenant_id: tenantId,
      category: data.category,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date + 'T12:00:00'),
    },
  })

  // Também lança como transação EXPENSE para o financeiro ficar completo
  await prisma.transaction.create({
    data: {
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: data.category,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date + 'T12:00:00'),
    },
  })

  revalidatePath('/dashboard/despesas')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
}

export async function deleteExpense(id: string) {
  const tenantId = await getTenantId()
  await prisma.expense.delete({ where: { id, tenant_id: tenantId } })
  revalidatePath('/dashboard/despesas')
  revalidatePath('/dashboard/financeiro')
}
