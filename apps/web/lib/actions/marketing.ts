'use server'

import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import { getBlastQueue } from '@/lib/queue/queues'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const BlastSchema = z.object({
  message: z.string().min(5, 'Mensagem muito curta').max(1000),
  filter: z.enum(['all', 'last30', 'last90', 'inactive']).default('all'),
})

export type BlastResult =
  | { success: true; queued: number }
  | { success: false; error: string }

export async function sendWhatsAppBlast(formData: FormData): Promise<BlastResult> {
  try {
    const tenantId = await getTenantId()
    const data = BlastSchema.parse(Object.fromEntries(formData))

    // Build client filter
    const now = new Date()
    let dateFilter: { gte?: Date; lt?: Date } | undefined

    if (data.filter === 'last30') {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      dateFilter = { gte: d }
    } else if (data.filter === 'last90') {
      const d = new Date(now)
      d.setDate(d.getDate() - 90)
      dateFilter = { gte: d }
    } else if (data.filter === 'inactive') {
      const d = new Date(now)
      d.setDate(d.getDate() - 60)
      dateFilter = { lt: d }
    }

    // Find clients with phone
    let clientIds: string[] | undefined

    if (dateFilter !== undefined) {
      const appts = await prisma.appointment.findMany({
        where: {
          tenant_id: tenantId,
          date: dateFilter,
          status: 'COMPLETED',
        },
        select: { client_id: true },
        distinct: ['client_id'],
      })
      clientIds = appts.map((a) => a.client_id)
      if (clientIds.length === 0) {
        return { success: false, error: 'Nenhum cliente encontrado com esse filtro.' }
      }
    }

    const clients = await prisma.client.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
        phone: { not: null },
        ...(clientIds ? { id: { in: clientIds } } : {}),
      },
      select: { phone: true },
    })

    const phones = clients.map((c) => c.phone!).filter(Boolean)
    if (phones.length === 0) {
      return { success: false, error: 'Nenhum cliente com WhatsApp cadastrado.' }
    }

    // Enqueue blast job
    await getBlastQueue().add(
      'blast',
      { tenantId, phones, message: data.message },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
      },
    )

    return { success: true, queued: phones.length }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    return { success: false, error: 'Erro ao enfileirar disparo.' }
  }
}
