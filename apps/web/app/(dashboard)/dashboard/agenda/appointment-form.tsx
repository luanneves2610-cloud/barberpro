'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@barberpro/ui'
import { Select } from '@/components/ui/select'
import { Input } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { createAppointment } from '@/lib/actions/appointments'
import type { Barber, Service, Client } from '@barberpro/types'
import { RefreshCw } from 'lucide-react'

interface AppointmentFormProps {
  barbers: Barber[]
  services: Service[]
  clients: Client[]
  defaultDate?: string
  onSuccess: () => void
}

const PAYMENT_OPTIONS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
]

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMin = 8 * 60 + i * 30
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return { value: `${h}:${m}`, label: `${h}:${m}` }
})

const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: 'Sem recorrência' },
  { value: 'WEEKLY', label: 'Semanalmente' },
  { value: 'BIWEEKLY', label: 'A cada 2 semanas' },
  { value: 'MONTHLY', label: 'Mensalmente' },
]

const RECURRENCE_COUNT_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: String(i + 2),
  label: `${i + 2}x`,
}))

export function AppointmentForm({
  barbers,
  services,
  clients,
  defaultDate,
  onSuccess,
}: AppointmentFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [recurrence, setRecurrence] = useState('NONE')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Garante que recurrence está no FormData (controlled via state)
    formData.set('recurrence', recurrence)

    startTransition(async () => {
      try {
        await createAppointment(formData)
        formRef.current?.reset()
        setRecurrence('NONE')
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar agendamento')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Cliente *"
        name="client_id"
        placeholder="Selecione o cliente"
        options={clients.map((c) => ({ value: c.id, label: `${c.name}${c.phone ? ` — ${c.phone}` : ''}` }))}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Barbeiro *"
          name="barber_id"
          placeholder="Selecione"
          options={barbers.filter((b) => b.is_active).map((b) => ({ value: b.id, label: b.name }))}
          required
        />
        <Select
          label="Serviço *"
          name="service_id"
          placeholder="Selecione"
          options={services.filter((s) => s.is_active).map((s) => ({
            value: s.id,
            label: `${s.icon ?? ''} ${s.name} — ${Number(s.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
          }))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data *"
          name="date"
          type="date"
          defaultValue={defaultDate ?? new Date().toISOString().slice(0, 10)}
          required
        />
        <Select
          label="Horário *"
          name="start_time"
          placeholder="Selecione"
          options={TIME_SLOTS}
          required
        />
      </div>
      <Select
        label="Forma de pagamento"
        name="payment_method"
        placeholder="A definir"
        options={PAYMENT_OPTIONS}
      />

      {/* Recorrência */}
      <div className="rounded-lg border border-zinc-700 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Recorrência</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label=""
            name="recurrence"
            placeholder="Sem recorrência"
            options={RECURRENCE_OPTIONS}
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          />
          {recurrence !== 'NONE' && (
            <Select
              label=""
              name="recurrence_count"
              placeholder="Qtd"
              options={RECURRENCE_COUNT_OPTIONS}
              defaultValue="4"
            />
          )}
        </div>
        {recurrence !== 'NONE' && (
          <p className="text-xs text-amber-400/80">
            Serão criados múltiplos agendamentos com o mesmo horário.
          </p>
        )}
      </div>

      <Textarea
        label="Observações"
        name="notes"
        placeholder="Preferências do cliente, observações..."
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          Confirmar agendamento
        </Button>
      </div>
    </form>
  )
}
