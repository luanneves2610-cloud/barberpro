import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Recuperar senha</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-zinc-500">
        Lembrou a senha?{' '}
        <a
          href="/login"
          className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Voltar ao login
        </a>
      </p>
    </div>
  )
}
