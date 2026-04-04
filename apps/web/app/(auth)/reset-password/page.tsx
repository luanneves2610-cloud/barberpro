import type { Metadata } from 'next'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Redefinir senha' }

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Redefinir senha</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Escolha uma nova senha para a sua conta.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
