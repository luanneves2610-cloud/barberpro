'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { createClientRecord, updateClientRecord } from '@/lib/actions/clients'
import type { Client } from '@barberpro/types'

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (client) {
          await updateClientRecord(client.id, formData)
        } else {
          await createClientRecord(formData)
        }
        formRef.current?.reset()
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar cliente')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome completo *"
        name="name"
        placeholder="Pedro Santos"
        defaultValue={client?.name}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Telefone"
          name="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={client?.phone ?? ''}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="pedro@email.com"
          defaultValue={client?.email ?? ''}
        />
      </div>
      <Input
        label="Data de nascimento"
        name="birth_date"
        type="date"
        defaultValue={client?.birth_date ? client.birth_date.slice(0, 10) : ''}
      />
      <Textarea
        label="Observações"
        name="notes"
        placeholder="Preferências, alergias, observações..."
        defaultValue={client?.notes ?? ''}
      />
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          {client ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}
