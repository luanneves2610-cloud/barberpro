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

const ProductSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Preço de venda obrigatório'),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  min_stock: z.coerce.number().int().min(0).default(5),
})

export async function createProduct(formData: FormData) {
  const tenantId = await getTenantId()
  const data = ProductSchema.parse(Object.fromEntries(formData))

  await prisma.product.create({
    data: {
      tenant_id: tenantId,
      name: data.name,
      category: data.category || null,
      description: data.description || null,
      price: data.price,
      cost: data.cost ?? null,
      stock: data.stock,
      min_stock: data.min_stock,
    },
  })
  revalidatePath('/dashboard/produtos')
}

export async function updateProduct(id: string, formData: FormData) {
  const tenantId = await getTenantId()
  const data = ProductSchema.parse(Object.fromEntries(formData))

  await prisma.product.update({
    where: { id, tenant_id: tenantId },
    data: {
      name: data.name,
      category: data.category || null,
      description: data.description || null,
      price: data.price,
      cost: data.cost ?? null,
      stock: data.stock,
      min_stock: data.min_stock,
    },
  })
  revalidatePath('/dashboard/produtos')
}

export async function toggleProductStatus(id: string) {
  const tenantId = await getTenantId()
  const product = await prisma.product.findUnique({ where: { id, tenant_id: tenantId } })
  if (!product) throw new Error('Produto não encontrado')
  await prisma.product.update({ where: { id }, data: { is_active: !product.is_active } })
  revalidatePath('/dashboard/produtos')
}

const SellSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantidade obrigatória'),
  payment_method: z.enum(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']).optional(),
})

export async function sellProduct(formData: FormData) {
  const tenantId = await getTenantId()
  const data = SellSchema.parse(Object.fromEntries(formData))

  const product = await prisma.product.findUnique({
    where: { id: data.product_id, tenant_id: tenantId },
  })
  if (!product) throw new Error('Produto não encontrado')
  if (product.stock < data.quantity) {
    throw new Error(`Estoque insuficiente — disponível: ${product.stock}`)
  }

  const total = Number(product.price) * data.quantity

  await prisma.productSale.create({
    data: {
      tenant_id: tenantId,
      product_id: data.product_id,
      quantity: data.quantity,
      unit_price: product.price,
      total,
    },
  })

  await prisma.product.update({
    where: { id: data.product_id },
    data: { stock: { decrement: data.quantity } },
  })

  await prisma.transaction.create({
    data: {
      tenant_id: tenantId,
      type: 'INCOME',
      category: 'Produto',
      description: `Venda: ${product.name} (${data.quantity}x)`,
      amount: total,
      payment_method: data.payment_method ?? null,
      date: new Date(),
    },
  })

  revalidatePath('/dashboard/produtos')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
}

const RestockSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantidade deve ser positiva'),
  note: z.string().optional(),
})

export async function addStock(formData: FormData) {
  const tenantId = await getTenantId()
  const data = RestockSchema.parse(Object.fromEntries(formData))

  const product = await prisma.product.findUnique({
    where: { id: data.product_id, tenant_id: tenantId },
  })
  if (!product) throw new Error('Produto não encontrado')

  await prisma.product.update({
    where: { id: data.product_id },
    data: { stock: { increment: data.quantity } },
  })

  revalidatePath('/dashboard/produtos')
}
