import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

const ERROR_MESSAGES: Record<string, string> = {
  link_expirado: 'O link de recuperação de senha expirou. Solicite um novo.',
  sem_acesso: 'Você não tem permissão para acessar esta área.',
  sessao_expirada: 'Sua sessão expirou. Por favor, faça login novamente.',
}

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  const errorMsg = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? 'Ocorreu um erro. Tente novamente.')
    : null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-zinc-400">Entre com sua conta para acessar o painel</p>
      </div>

      {errorMsg && (
        <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {errorMsg}
        </div>
      )}

      <LoginForm />
      <p className="mt-6 text-center text-sm text-zinc-500">
        Novo por aqui?{' '}
        <a href="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          Criar conta grátis
        </a>
      </p>
    </div>
  )
}
