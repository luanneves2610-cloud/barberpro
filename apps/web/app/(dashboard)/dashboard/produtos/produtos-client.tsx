'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Pencil, Power, ShoppingCart, Package, AlertTriangle,
  PackagePlus, History, TrendingUp,
} from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { ProductForm } from './product-form'
import { SellForm } from './sell-form'
import { RestockForm } from './restock-form'
import { toggleProductStatus } from '@/lib/actions/products'
import type { Product } from '@barberpro/types'

interface SaleRecord {
  id: string
  product_name: string
  product_category: string | null
  quantity: number
  unit_price: number
  total: number
  sold_at: string
}

interface Metrics {
  total: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
  salesRevenue30d: number
}

interface Props {
  products: Product[]
  metrics: Metrics
  sales: SaleRecord[]
}

type Tab = 'estoque' | 'vendas'

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30">
        Sem estoque
      </span>
    )
  }
  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30">
        <AlertTriangle className="h-2.5 w-2.5" /> Baixo ({stock})
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400 ring-1 ring-inset ring-green-500/30">
      {stock} un.
    </span>
  )
}

export function ProdutosClient({ products, metrics, sales }: Props) {
  const [tab, setTab] = useState<Tab>('estoque')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [selling, setSelling] = useState<Product | null>(null)
  const [restocking, setRestocking] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      {/* Alertas de estoque */}
      {(metrics.outOfStock > 0 || metrics.lowStock > 0) && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-300">Atenção ao estoque</p>
            <p className="text-amber-400/80 mt-0.5">
              {metrics.outOfStock > 0 && `${metrics.outOfStock} produto(s) sem estoque. `}
              {metrics.lowStock > 0 && `${metrics.lowStock} produto(s) com estoque baixo.`}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Produtos ativos', value: metrics.total, color: 'text-zinc-100' },
          {
            label: 'Estoque baixo',
            value: metrics.lowStock,
            color: metrics.lowStock > 0 ? 'text-amber-400' : 'text-zinc-100',
          },
          {
            label: 'Sem estoque',
            value: metrics.outOfStock,
            color: metrics.outOfStock > 0 ? 'text-red-400' : 'text-zinc-100',
          },
          { label: 'Valor em estoque', value: fmtCurrency(metrics.inventoryValue), color: 'text-zinc-100' },
          {
            label: 'Vendas (30 dias)',
            value: fmtCurrency(metrics.salesRevenue30d),
            color: metrics.salesRevenue30d > 0 ? 'text-green-400' : 'text-zinc-100',
          },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-400 mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {([
            { value: 'estoque' as const, label: 'Estoque', Icon: Package },
            { value: 'vendas' as const, label: 'Histórico de Vendas', Icon: History },
          ]).map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={[
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === value
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-100',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'estoque' && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        )}
      </div>

      {/* ── TAB: Estoque ─────────────────────────────────────────────── */}
      {tab === 'estoque' && (
        <>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado"
              description="Adicione produtos para controlar o estoque e registrar vendas"
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Adicionar produto
                </Button>
              }
            />
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Custo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Estoque</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={[
                        'hover:bg-zinc-800/40 transition-colors',
                        !product.is_active ? 'opacity-50' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-100">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-zinc-400">{product.category ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-100">
                          {fmtCurrency(product.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-zinc-400">
                          {product.cost ? fmtCurrency(product.cost) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={product.stock} minStock={product.min_stock} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {product.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Entrada de estoque"
                              onClick={() => setRestocking(product)}
                            >
                              <PackagePlus className="h-3.5 w-3.5 text-blue-400" />
                            </Button>
                          )}
                          {product.is_active && product.stock > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Registrar venda"
                              onClick={() => setSelling(product)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 text-green-400" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Editar"
                            onClick={() => setEditing(product)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={product.is_active ? 'Desativar' : 'Ativar'}
                            loading={isPending}
                            onClick={() => startTransition(() => toggleProductStatus(product.id))}
                          >
                            <Power
                              className={`h-3.5 w-3.5 ${product.is_active ? 'text-zinc-400' : 'text-green-400'}`}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── TAB: Histórico de Vendas ─────────────────────────────────── */}
      {tab === 'vendas' && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Vendas nos últimos 30 dias</h3>
            </div>
            {sales.length > 0 && (
              <span className="text-xs text-zinc-500">{sales.length} venda(s)</span>
            )}
          </div>

          {sales.length === 0 ? (
            <div className="bg-zinc-900/50 py-12 text-center">
              <History className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500">Nenhuma venda nos últimos 30 dias</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Qtd.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Unit.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-300">
                          {new Date(s.sold_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(s.sold_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-100">{s.product_name}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-zinc-400">{s.product_category ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-100">{s.quantity}×</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-zinc-400">{fmtCurrency(s.unit_price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-green-400">{fmtCurrency(s.total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-800 bg-zinc-900">
                    <td colSpan={4} className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Total do período
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell" />
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-green-400">
                        {fmtCurrency(sales.reduce((acc, s) => acc + s.total, 0))}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo produto">
        <ProductForm onSuccess={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar produto"
        description={editing ? `Editando: ${editing.name}` : ''}
      >
        {editing && <ProductForm product={editing} onSuccess={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!selling} onClose={() => setSelling(null)} title="Registrar venda" size="sm">
        {selling && <SellForm product={selling} onSuccess={() => setSelling(null)} />}
      </Modal>

      <Modal
        open={!!restocking}
        onClose={() => setRestocking(null)}
        title="Entrada de Estoque"
        description="Adicionar unidades ao estoque do produto"
        size="sm"
      >
        {restocking && (
          <RestockForm product={restocking} onSuccess={() => setRestocking(null)} />
        )}
      </Modal>
    </>
  )
}
