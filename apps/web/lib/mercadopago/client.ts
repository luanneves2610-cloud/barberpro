/**
 * Mercado Pago — Checkout Pro + Webhooks
 * Docs: https://www.mercadopago.com.br/developers
 *
 * Variáveis de ambiente necessárias:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
 *   MERCADOPAGO_WEBHOOK_SECRET=seu_segredo_webhook
 */

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface MPPreferenceParams {
  title: string
  unitPrice: number
  quantity?: number
  payerEmail: string
  externalReference: string // ex: "subscription:{tenantId}:{plan}"
}

export async function createMPPreference(params: MPPreferenceParams) {
  if (!ACCESS_TOKEN) throw new Error('Mercado Pago não configurado')

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: params.title,
          unit_price: params.unitPrice,
          quantity: params.quantity ?? 1,
          currency_id: 'BRL',
        },
      ],
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      back_urls: {
        success: `${APP_URL}/sucesso`,
        failure: `${APP_URL}/cancelamento`,
        pending: `${APP_URL}/sucesso`,
      },
      auto_return: 'approved',
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mercado Pago erro: ${err}`)
  }

  const data = await res.json()
  return {
    id: data.id as string,
    initPoint: data.init_point as string, // URL de checkout
    sandboxInitPoint: data.sandbox_init_point as string,
  }
}

export async function getMPPayment(paymentId: string) {
  if (!ACCESS_TOKEN) throw new Error('Mercado Pago não configurado')

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  })

  if (!res.ok) throw new Error('Erro ao buscar pagamento')
  return res.json()
}

/** Verifica assinatura do webhook (x-signature header) */
export function verifyMPSignature(
  signatureHeader: string,
  requestId: string,
  dataId: string,
  ts: string,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // Se não configurado, aceita tudo (dev)

  try {
    const crypto = require('crypto') as typeof import('crypto')
    const manifest = `id:${dataId};request-date:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
    const parts = signatureHeader.split(',')
    const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1]
    return v1 === hmac
  } catch {
    return false
  }
}
