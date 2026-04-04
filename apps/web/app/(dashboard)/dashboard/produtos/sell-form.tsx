'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Select } from '@/components/ui/select'
import { sellProduct } from '@/lib/actions/products'
import type { Product } from '@barberpro/types'

interface Props {
  product: Product
  onSuccess: () => void
}

const PAYMENT_OPTIONS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
]

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SellForm({ product, onSuccess }: Props) {
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const total = product.price * qty

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('product_id', product.id)

    startTransition(async () => {
      try {
        await sellProduct(formData)
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar venda')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Product info */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
        <p className="text-sm font-medium text-zinc-100">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-zinc-400">
            Preço unitário: <span className="text-amber-400 font-medium">{fmtCurrency(product.price)}</span>
          </p>
          <p className="text-xs text-zinc-400">
            Estoque: <span className="text-zinc-100 font-medium">{product.stock} un.</span>
          </p>
        </div>
      </div>

      <Input
        label="Quantidade *"
        name="quantity"
        type="number"
        min="1"
        max={product.stock}
        defaultValue={1}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
        required
      />

      <Select
        label="Forma de pagamento"
        name="payment_method"
        placeholder="Selecione"
        options={PAYMENT_OPTIONS}
      />

      {/* Total preview */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-zinc-400">Total</span>
        <span className="text-base font-bold text-green-400">{fmtCurrency(total)}</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          Confirmar venda
        </Button>
      </div>
    </form>
  )
}
