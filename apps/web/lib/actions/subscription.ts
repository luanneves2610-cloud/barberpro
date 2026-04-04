'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import { createMPPreference } from '@/lib/mercadopago/client'
import { PLAN_CONFIG } from '@barberpro/types'
import type { Plan } from '@barberpro/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    include: { tenant: true },
  })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile
}

export async function createSubscriptionCheckout(plan: Plan) {
  const profile = await getUser()
  const config = PLAN_CONFIG[plan]

  const preference = await createMPPreference({
    title: `BarberPro ${config.name} — Mensal`,
    unitPrice: config.price,
    payerEmail: profile.email,
    externalReference: `subscription:${profile.tenant_id}:${plan}`,
  })

  redirect(preference.initPoint)
}
