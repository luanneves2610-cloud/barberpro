'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTransaction } from '@/lib/actions/transactions'

const INCOME_CATEGORIES = [
  'Serviço', 'Produto', 'Gorjeta', 'Outro',
]

const EXPENSE_CATEGORIES = [
  'Aluguel', 'Salário / Comissão', 'Produto / Insumo',
  'Equipamento', 'Marketing', 'Utilidades', 'Manutenção', 'Outro',
]

const PAYMENT_OPTIONS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
]

interface Props {
  onSuccess: () => void
  defaultDate?: string
}

export function TransactionForm({ onSuccess, defaultDate }: Props) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('type', type)

    startTransition(async () => {
      try {
        await createTransaction(formData)
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar transação')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('INCOME')}
          className={[
            'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border',
            type === 'INCOME'
              ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700',
          ].join(' ')}
        >
          + Receita
        </button>
        <button
          type="button"
          onClick={() => setType('EXPENSE')}
          className={[
            'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border',
            type === 'EXPENSE'
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700',
          ].join(' ')}
        >
          − Despesa
        </button>
      </div>

      <Select
        label="Categoria *"
        name="category"
        placeholder="Selecione"
        options={categories.map((c) => ({ value: c, label: c }))}
        required
      />

      <Textarea
        label="Descrição"
        name="description"
        placeholder="Detalhes do lançamento..."
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

      <Select
        label="Forma de pagamento"
        name="payment_method"
        placeholder="Opcional"
        options={PAYMENT_OPTIONS}
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          Salvar lançamento
        </Button>
      </div>
    </form>
  )
}
