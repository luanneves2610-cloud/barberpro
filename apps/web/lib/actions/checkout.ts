'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp, msgServicoConcluidoComRecibo } from '@/lib/whatsapp'
import type { PaymentMethod } from '@barberpro/types'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const CheckoutSchema = z.object({
  appointmentId: z.string().min(1),
  paymentMethod: z.enum(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']),
  discount: z.coerce.number().min(0).max(100).default(0),
  extraProducts: z.string().optional(), // JSON: [{productId, qty}]
})

export type CheckoutResult =
  | { success: true; total: number }
  | { success: false; error: string }

export async function checkoutAppointment(formData: FormData): Promise<CheckoutResult> {
  try {
    const tenantId = await getTenantId()
    const data = CheckoutSchema.parse(Object.fromEntries(formData))

    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId, tenant_id: tenantId },
      include: {
        client: true,
        service: true,
        barber: true,
      },
    })

    if (!appointment) return { success: false, error: 'Agendamento não encontrado.' }
    if (appointment.status === 'COMPLETED') return { success: false, error: 'Agendamento já concluído.' }

    const servicePrice = Number(appointment.price)
    const discountAmt = (servicePrice * data.discount) / 100
    let total = servicePrice - discountAmt

    // Process extra products
    let productsTotal = 0
    const extraProducts: { productId: string; qty: number }[] = data.extraProducts
      ? JSON.parse(data.extraProducts)
      : []

    for (const item of extraProducts) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, tenant_id: tenantId },
      })
      if (!product || product.stock < item.qty) {
        return { success: false, error: `Produto "${product?.name ?? item.productId}" sem estoque suficiente.` }
      }
      const itemTotal = Number(product.price) * item.qty
      productsTotal += itemTotal
    }

    total += productsTotal

    // Execute everything in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update appointment
      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: {
          status: 'COMPLETED',
          payment_method: data.paymentMethod as PaymentMethod,
          payment_status: 'PAID',
          price: total, // update price with discount applied
        },
      })

      // 2. Service transaction
      await tx.transaction.create({
        data: {
          tenant_id: tenantId,
          appointment_id: data.appointmentId,
          type: 'INCOME',
          category: 'Serviço',
          description: `${appointment.service.name} — ${appointment.client.name}${data.discount > 0 ? ` (${data.discount}% desc.)` : ''}`,
          amount: servicePrice - discountAmt,
          payment_method: data.paymentMethod as PaymentMethod,
          date: appointment.date,
        },
      })

      // 3. Products
      for (const item of extraProducts) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) continue
        const itemTotal = Number(product.price) * item.qty

        await tx.productSale.create({
          data: {
            tenant_id: tenantId,
            appointment_id: data.appointmentId,
            product_id: item.productId,
            quantity: item.qty,
            unit_price: product.price,
            total: itemTotal,
          },
        })

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        })

        await tx.transaction.create({
          data: {
            tenant_id: tenantId,
            appointment_id: data.appointmentId,
            type: 'INCOME',
            category: 'Produto',
            description: `${product.name} ×${item.qty} — ${appointment.client.name}`,
            amount: itemTotal,
            payment_method: data.paymentMethod as PaymentMethod,
            date: appointment.date,
          },
        })
      }
    })

    // WhatsApp receipt
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })
    if (appointment.client.phone) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      await sendWhatsApp(
        appointment.client.phone,
        msgServicoConcluidoComRecibo({
          clientName: appointment.client.name,
          serviceName: appointment.service.name,
          price: total,
          tenantName: tenant?.name ?? 'Barbearia',
          appointmentId: data.appointmentId,
          baseUrl,
        }),
      )
    }

    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard')
    return { success: true, total }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    return { success: false, error: 'Erro ao finalizar atendimento.' }
  }
}
