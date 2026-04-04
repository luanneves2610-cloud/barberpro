'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/components/ui/toast'
import { updateTenant } from '@/lib/actions/tenant'
import type { Tenant } from '@barberpro/types'

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export function TenantForm({ tenant }: { tenant: Tenant }) {
  const { success, error } = useToast()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? '')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('logo_url', logoUrl)

    startTransition(async () => {
      try {
        await updateTenant(formData)
        success('Dados salvos com sucesso!')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Erro ao salvar dados')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Logo */}
      <ImageUpload
        label="Logo da barbearia"
        value={logoUrl}
        onChange={setLogoUrl}
        bucket="logos"
        hint="Recomendado: PNG com fundo transparente, mín. 200×200px"
        className="max-w-xs"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nome da barbearia *"
          name="name"
          placeholder="Barbearia do João"
          defaultValue={tenant.name}
          required
        />
        <Input
          label="Telefone"
          name="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={tenant.phone ?? ''}
        />
      </div>

      <Input
        label="Endereço"
        name="address"
        placeholder="Rua das Flores, 123"
        defaultValue={tenant.address ?? ''}
        hint="Ex: Rua das Flores, 123 — necessário para NF-e"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            label="Cidade"
            name="city"
            placeholder="São Paulo"
            defaultValue={tenant.city ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Estado</label>
          <select
            name="state"
            defaultValue={tenant.state ?? ''}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">—</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Meta mensal de receita (R$)"
        name="monthly_goal"
        type="number"
        min="0"
        step="100"
        placeholder="Ex: 15000"
        defaultValue={tenant.monthly_goal ?? ''}
        hint="Aparece como barra de progresso no Dashboard"
      />

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          Salvar dados
        </Button>
      </div>
    </form>
  )
}
