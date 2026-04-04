'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { createBarber, updateBarber } from '@/lib/actions/barbers'
import type { Barber } from '@barberpro/types'

interface BarberFormProps {
  barber?: Barber
  onSuccess: () => void
}

export function BarberForm({ barber, onSuccess }: BarberFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(barber?.avatar_url ?? '')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Inject avatar_url (managed outside native form)
    formData.set('avatar_url', avatarUrl)

    startTransition(async () => {
      try {
        if (barber) {
          await updateBarber(barber.id, formData)
        } else {
          await createBarber(formData)
        }
        formRef.current?.reset()
        setAvatarUrl('')
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar barbeiro')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ImageUpload
        label="Foto do barbeiro"
        value={avatarUrl}
        onChange={setAvatarUrl}
        bucket="avatars"
        hint="JPG ou PNG quadrado, mín. 200×200px"
      />

      <Input
        label="Nome *"
        name="name"
        placeholder="João Silva"
        defaultValue={barber?.name}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="joao@barbearia.com"
          defaultValue={barber?.email ?? ''}
        />
        <Input
          label="Telefone"
          name="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={barber?.phone ?? ''}
        />
      </div>
      <Input
        label="Comissão (%)"
        name="commission_pct"
        type="number"
        min="0"
        max="100"
        step="0.5"
        placeholder="0"
        defaultValue={barber?.commission_pct ?? 0}
        hint="Percentual sobre cada serviço"
      />
      <Textarea
        label="Bio"
        name="bio"
        placeholder="Especialidades, experiência..."
        defaultValue={barber?.bio ?? ''}
      />
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          {barber ? 'Salvar alterações' : 'Adicionar barbeiro'}
        </Button>
      </div>
    </form>
  )
}
