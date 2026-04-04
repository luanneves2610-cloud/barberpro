'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { createExpense } from '@/lib/actions/expenses'

const CATEGORIES = [
  'Aluguel', 'Água / Luz / Internet', 'Salário / Comissão',
  'Produto / Insumo', 'Equipamento', 'Manutenção',
  'Marketing / Publicidade', 'Contabilidade', 'Impostos', 'Outros',
]

interface Props {
  onSuccess: () => void
  defaultDate?: string
}

export function ExpenseForm({ onSuccess, defaultDate }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createExpense(fd)
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar despesa')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Categoria *</label>
        <select
          name="category"
          required
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Selecione</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Textarea
        label="Descrição *"
        name="description"
        placeholder="Ex: Aluguel de março, conta de luz..."
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$) *"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          required
        />
        <Input
          label="Data *"
          name="date"
          type="date"
          defaultValue={defaultDate ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          Salvar despesa
        </Button>
      </div>
    </form>
  )
}
