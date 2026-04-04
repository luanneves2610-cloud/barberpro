import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { ProdutosClient } from './produtos-client'
import type { Product } from '@barberpro/types'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProdutosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [productsRaw, salesRaw] = await Promise.all([
    prisma.product.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    }),
    prisma.productSale.findMany({
      where: { tenant_id: tenantId, sold_at: { gte: thirtyDaysAgo } },
      include: { product: { select: { name: true, category: true } } },
      orderBy: { sold_at: 'desc' },
      take: 50,
    }),
  ])

  const products: Product[] = productsRaw.map((p) => ({
    id: p.id,
    tenant_id: p.tenant_id,
    name: p.name,
    category: p.category ?? null,
    description: p.description ?? null,
    price: Number(p.price),
    cost: p.cost ? Number(p.cost) : null,
    stock: p.stock,
    min_stock: p.min_stock,
    image_url: p.image_url ?? null,
    is_active: p.is_active,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }))

  const sales = salesRaw.map((s) => ({
    id: s.id,
    product_name: s.product.name,
    product_category: s.product.category ?? null,
    quantity: s.quantity,
    unit_price: Number(s.unit_price),
    total: Number(s.total),
    sold_at: s.sold_at.toISOString(),
  }))

  const lowStock = products.filter((p) => p.is_active && p.stock > 0 && p.stock <= p.min_stock)
  const outOfStock = products.filter((p) => p.is_active && p.stock === 0)
  const inventoryValue = products
    .filter((p) => p.is_active)
    .reduce((s, p) => s + p.price * p.stock, 0)
  const salesRevenue30d = sales.reduce((s, sale) => s + sale.total, 0)

  const metrics = {
    total: products.filter((p) => p.is_active).length,
    lowStock: lowStock.length,
    outOfStock: outOfStock.length,
    inventoryValue,
    salesRevenue30d,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Produtos" description="Gestão de estoque e vendas" />
      <ProdutosClient products={products} metrics={metrics} sales={sales} />
    </div>
  )
}
