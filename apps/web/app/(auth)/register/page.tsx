import type { Metadata } from 'next'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Criar conta' }

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Crie sua conta grátis</h1>
        <p className="mt-1 text-sm text-zinc-400">
          7 dias grátis, sem cartão de crédito
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-zinc-500">
        Já tem conta?{' '}
        <a href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          Entrar
        </a>
      </p>
    </div>
  )
}
