'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerTenant, checkSlugAvailability } from '@/lib/auth/actions'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const schema = z.object({
  tenantName: z.string().min(2, 'Nome da barbearia obrigatório'),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  ownerName: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const tenantName = watch('tenantName')
  const slug = watch('slug')

  function handleTenantNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setValue('tenantName', value)
    setValue('slug', generateSlug(value))
    setSlugAvailable(null)
  }

  async function handleSlugBlur() {
    if (!slug || slug.length < 3) return
    setCheckingSlug(true)
    const available = await checkSlugAvailability(slug)
    setSlugAvailable(available)
    setCheckingSlug(false)
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    if (slugAvailable === false) {
      setServerError('Este slug já está em uso. Escolha outro.')
      return
    }
    const result = await registerTenant(data)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nome da Barbearia"
        placeholder="Barbearia do João"
        error={errors.tenantName?.message}
        {...register('tenantName')}
        onChange={handleTenantNameChange}
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Slug (URL da barbearia)"
          placeholder="barbearia-do-joao"
          error={errors.slug?.message}
          hint={
            slug
              ? `barberpro.app/${slug}`
              : 'Identificador único da sua barbearia'
          }
          {...register('slug')}
          onBlur={handleSlugBlur}
        />
        {checkingSlug && (
          <p className="text-xs text-zinc-500">Verificando disponibilidade...</p>
        )}
        {slugAvailable === true && (
          <p className="text-xs text-green-400">✓ Disponível</p>
        )}
        {slugAvailable === false && (
          <p className="text-xs text-red-400">✗ Slug já em uso</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Seu nome"
          placeholder="João Silva"
          error={errors.ownerName?.message}
          {...register('ownerName')}
        />
        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          type="tel"
          {...register('phone')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="joao@barbearia.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Senha"
        type="password"
        placeholder="••••••••"
        hint="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
        Criar conta grátis
      </Button>

      <p className="text-center text-xs text-zinc-600">
        Ao criar sua conta, você concorda com nossos{' '}
        <a href="/terms" className="text-zinc-400 hover:text-zinc-300">
          Termos de Uso
        </a>
      </p>
    </form>
  )
}
