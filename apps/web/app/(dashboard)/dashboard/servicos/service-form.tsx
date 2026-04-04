'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { createService, updateService } from '@/lib/actions/services'
import type { Service } from '@barberpro/types'

const ICONS = ['✂️','💈','🪒','💇','🧴','🧼','👑','⭐','🔥','💎']

interface ServiceFormProps {
  service?: Service
  onSuccess: () => void
}

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [icon, setIcon] = useState(service?.icon ?? '✂️')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('icon', icon)

    startTransition(async () => {
      try {
        if (service) {
          await updateService(service.id, formData)
        } else {
          await createService(formData)
        }
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar serviço')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Ícone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={[
                'h-10 w-10 rounded-lg text-xl transition-all',
                icon === i
                  ? 'bg-amber-500/20 ring-2 ring-amber-500'
                  : 'bg-zinc-800 hover:bg-zinc-700',
              ].join(' ')}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Nome do serviço *"
        name="name"
        placeholder="Corte de cabelo"
        defaultValue={service?.name}
        required
      />
      <Textarea
        label="Descrição"
        name="description"
        placeholder="Descreva o serviço..."
        defaultValue={service?.description ?? ''}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Duração (minutos) *"
          name="duration"
          type="number"
          min="5"
          max="480"
          step="5"
          placeholder="30"
          defaultValue={service?.duration ?? 30}
          required
        />
        <Input
          label="Preço (R$) *"
          name="price"
          type="number"
          min="0"
          step="0.50"
          placeholder="0,00"
          defaultValue={service?.price ?? ''}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          {service ? 'Salvar alterações' : 'Criar serviço'}
        </Button>
      </div>
    </form>
  )
}
