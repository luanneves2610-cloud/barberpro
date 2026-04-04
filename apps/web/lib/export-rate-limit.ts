/**
 * Helper de rate limit para rotas de exportação CSV.
 * Limita a 30 exports por usuário a cada 10 minutos.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export async function checkExportRateLimit(
  req: NextRequest,
): Promise<{ userId: string; tenantId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // 30 exports por usuário a cada 10 minutos
  const rl = await rateLimit(`export:${profile.id}`, 30, 600)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Limite de exportações atingido. Aguarde alguns minutos.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  return { userId: user.id, tenantId: profile.tenant_id }
}
