'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requestPasswordReset } from '@/lib/auth/actions'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await requestPasswordReset(data.email)
    if (result?.error) {
      setServerError(result.error)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        {/* Ícone de envelope */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-7 w-7 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">E-mail enviado!</p>
          <p className="text-sm text-zinc-400 mt-1">
            Enviamos o link de recuperação para{' '}
            <span className="text-zinc-300 font-medium">{getValues('email')}</span>.
            Verifique também a pasta de spam.
          </p>
        </div>
        <p className="text-xs text-zinc-600 pt-2">
          O link expira em 1 hora. Caso não receba, você pode solicitar novamente.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@barbearia.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
        Enviar link de recuperação
      </Button>
    </form>
  )
}
