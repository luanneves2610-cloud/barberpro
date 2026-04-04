'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { Product } from '@barberpro/types'

interface Props {
  product?: Product
  onSuccess: () => void
}

const CATEGORIES = [
  'Pomada', 'Shampoo', 'Condicionador', 'Finalizador', 'Óleo',
  'Navalha', 'Lâmina', 'Acessório', 'Outro',
]

export function ProductForm({ product, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.id, formData)
        } else {
          await createProduct(formData)
        }
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar produto')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome *"
        name="name"
        placeholder="Ex: Pomada Modeladora"
        defaultValue={product?.name}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Categoria</label>
        <select
          name="category"
          defaultValue={product?.category ?? ''}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Sem categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Textarea
        label="Descrição"
        name="description"
        placeholder="Marca, características, uso..."
        defaultValue={product?.description ?? ''}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Preço de venda (R$) *"
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          defaultValue={product?.price}
          required
        />
        <Input
          label="Custo (R$)"
          name="cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          defaultValue={product?.cost ?? ''}
          hint="Preço de compra"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Estoque atual"
          name="stock"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          defaultValue={product?.stock ?? 0}
          hint="Quantidade disponível"
        />
        <Input
          label="Estoque mínimo"
          name="min_stock"
          type="number"
          min="0"
          step="1"
          placeholder="5"
          defaultValue={product?.min_stock ?? 5}
          hint="Alerta abaixo desse valor"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          {product ? 'Salvar alterações' : 'Adicionar produto'}
        </Button>
      </div>
    </form>
  )
}
