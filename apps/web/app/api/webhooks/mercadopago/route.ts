import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { getMPPayment, verifyMPSignature } from '@/lib/mercadopago/client'
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: 60 webhooks por IP por minuto (proteção contra replay / flood)
  const ip = getClientIp(req)
  const rl = await rateLimit(`webhook:mp:${ip}`, 60, 60)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) })
  }

  try {
    const body = await req.json()
    const signatureHeader = req.headers.get('x-signature') ?? ''
    const requestId = req.headers.get('x-request-id') ?? ''

    // Tipos de notificação do Mercado Pago
    const type = body.type as string
    const dataId = body.data?.id as string

    if (!dataId) {
      return NextResponse.json({ ok: true }) // ping de teste
    }

    // Verificar assinatura
    const ts = signatureHeader.split(',').find((p) => p.startsWith('ts='))?.split('=')[1] ?? ''
    if (!verifyMPSignature(signatureHeader, requestId, dataId, ts)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (type === 'payment') {
      const payment = await getMPPayment(dataId)
      const externalRef = payment.external_reference as string // "subscription:{tenantId}:{plan}"
      const status = payment.status as string // approved | rejected | pending | in_process

      if (externalRef?.startsWith('subscription:')) {
        const [, tenantId, plan] = externalRef.split(':')

        if (status === 'approved') {
          // Busca assinatura existente
          const sub = await prisma.subscription.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
          })

          if (sub) {
            // Atualiza assinatura existente
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: 'ACTIVE',
                mercadopago_id: dataId,
                started_at: new Date(),
                ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
                trial_ends_at: null,
              },
            })

            // Atualiza plano do tenant se mudou
            if (plan && ['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
              await prisma.tenant.update({
                where: { id: tenantId },
                data: { plan: plan as 'BASIC' | 'PRO' | 'ENTERPRISE' },
              })
            }
          }

          // Cria notificação
          const profile = await prisma.profile.findFirst({
            where: { tenant_id: tenantId, role: 'OWNER' },
          })
          if (profile) {
            await prisma.notification.create({
              data: {
                tenant_id: tenantId,
                profile_id: profile.id,
                title: 'Pagamento confirmado!',
                body: `Sua assinatura foi ativada com sucesso.`,
                type: 'PAYMENT_RECEIVED',
              },
            })
          }
        } else if (status === 'rejected' || status === 'cancelled') {
          const sub = await prisma.subscription.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
          })
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: 'PAST_DUE' },
            })
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[MP Webhook] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
