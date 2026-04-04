'use server'

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

export async function searchClients(query: string) {
  if (!query || query.length < 2) return []

  try {
    const tenantId = await getTenantId()

    const results = await prisma.client.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true },
      take: 5,
      orderBy: { name: 'asc' },
    })

    return results.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? null,
      email: c.email ?? null,
    }))
  } catch {
    return []
  }
}
