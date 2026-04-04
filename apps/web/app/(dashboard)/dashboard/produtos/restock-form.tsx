'use client'

import { useRef, useState, useTransition } from 'react'
import { PackagePlus } from 'lucide-react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { addStock } from '@/lib/actions/products'
import type { Product } from '@barberpro/types'

interface Props {
  product: Product
  onSuccess: () => void
}

export function RestockForm({ product, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('product_id', product.id)

    startTransition(async () => {
      try {
        await addStock(formData)
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar estoque')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Produto info */}
      <div className="flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3">
        <PackagePlus className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{product.name}</p>
          <p className="text-xs text-zinc-400">
            Estoque atual:{' '}
            <span
              className={
                product.stock === 0
                  ? 'text-red-400 font-medium'
                  : product.stock <= product.min_stock
                  ? 'text-amber-400 font-medium'
                  : 'text-green-400 font-medium'
              }
            >
              {product.stock} un.
            </span>
          </p>
        </div>
      </div>

      <Input
        label="Quantidade a adicionar *"
        name="quantity"
        type="number"
        min={1}
        step={1}
        placeholder="10"
        required
      />

      <Textarea
        label="Observação (opcional)"
        name="note"
        placeholder="Fornecedor, nota fiscal, motivo..."
        rows={2}
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={isPending}>
          <PackagePlus className="h-4 w-4" />
          Confirmar entrada
        </Button>
      </div>
    </form>
  )
}
