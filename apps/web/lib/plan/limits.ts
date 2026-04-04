/**
 * Enforcement de limites por plano
 * BASIC  : 2 barbeiros, 200 agendamentos/mês
 * PRO    : 10 barbeiros, ilimitados
 * ENTERPRISE: ilimitado
 */

import { prisma } from '@barberpro/database'
import type { Plan } from '@barberpro/types'

export const PLAN_LIMITS = {
  BASIC: { barbers: 2, appointmentsPerMonth: 200 },
  PRO: { barbers: 10, appointmentsPerMonth: Infinity },
  ENTERPRISE: { barbers: Infinity, appointmentsPerMonth: Infinity },
} as const

export type PlanLimitKey = keyof typeof PLAN_LIMITS

export async function checkBarberLimit(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  })
  if (!tenant) throw new Error('Tenant não encontrado')

  const plan = tenant.plan as Plan
  const limit = PLAN_LIMITS[plan]?.barbers ?? Infinity
  if (limit === Infinity) return

  const count = await prisma.barber.count({
    where: { tenant_id: tenantId, is_active: true },
  })

  if (count >= limit) {
    throw new Error(
      `Limite do plano ${plan} atingido: máximo de ${limit} barbeiro${limit > 1 ? 's' : ''}. ` +
      `Faça upgrade para adicionar mais.`,
    )
  }
}

export async function checkAppointmentLimit(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  })
  if (!tenant) throw new Error('Tenant não encontrado')

  const plan = tenant.plan as Plan
  const limit = PLAN_LIMITS[plan]?.appointmentsPerMonth ?? Infinity
  if (limit === Infinity) return

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const count = await prisma.appointment.count({
    where: {
      tenant_id: tenantId,
      date: { gte: firstOfMonth, lt: firstOfNext },
      status: { not: 'CANCELLED' },
    },
  })

  if (count >= limit) {
    throw new Error(
      `Limite do plano ${plan} atingido: máximo de ${limit} agendamentos por mês. ` +
      `Faça upgrade para continuar.`,
    )
  }
}

export function getPlanLabel(plan: Plan): string {
  return { BASIC: 'Básico', PRO: 'Pro', ENTERPRISE: 'Enterprise' }[plan] ?? plan
}
