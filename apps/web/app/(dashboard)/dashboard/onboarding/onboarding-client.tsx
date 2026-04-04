'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Scissors, User, Settings, Rocket, ChevronRight, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { createBarber } from '@/lib/actions/barbers'
import { createService } from '@/lib/actions/services'
import { updateTenant } from '@/lib/actions/tenant'

interface Props {
  tenantSlug: string
  hasBarber: boolean
  hasService: boolean
  tenantName: string
}

type Step = 'welcome' | 'tenant' | 'barber' | 'service' | 'done'

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'welcome', label: 'Boas-vindas', icon: Rocket },
  { key: 'tenant', label: 'Barbearia', icon: Settings },
  { key: 'barber', label: 'Barbeiro', icon: User },
  { key: 'service', label: 'Serviço', icon: Scissors },
  { key: 'done', label: 'Pronto!', icon: Check },
]

function StepDot({ current, done, label, Icon }: {
  current: boolean; done: boolean; label: string; Icon: React.ElementType
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={[
        'h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all',
        done ? 'bg-amber-500 border-amber-500' : current ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800',
      ].join(' ')}>
        {done ? <Check className="h-4 w-4 text-zinc-950" /> : <Icon className={`h-4 w-4 ${current ? 'text-amber-400' : 'text-zinc-600'}`} />}
      </div>
      <span className={`text-[10px] font-medium ${current ? 'text-amber-400' : done ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  )
}

export function OnboardingClient({ tenantSlug, hasBarber, hasService, tenantName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const stepIdx = STEPS.findIndex((s) => s.key === step)
  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/agendar/${tenantSlug}`
    : `/agendar/${tenantSlug}`

  function handleCopy() {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── WELCOME ──────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8 text-center">
          <div>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500 mb-6">
              <Scissors className="h-10 w-10 text-zinc-950" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-3">
              Bem-vindo ao BarberPro! 🎉
            </h1>
            <p className="text-zinc-400 text-base">
              Vamos configurar sua barbearia em menos de 2 minutos.
              São apenas 3 passos rápidos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { step: '1', label: 'Dados da barbearia', icon: Settings },
              { step: '2', label: 'Adicionar barbeiro', icon: User },
              { step: '3', label: 'Criar serviço', icon: Scissors },
            ].map(({ step: n, label, icon: Icon }) => (
              <div key={n} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 font-bold">
                  {n}
                </div>
                <p className="text-xs text-zinc-400">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('tenant')}
            className="w-full rounded-xl bg-amber-500 py-3.5 text-base font-semibold text-zinc-950 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
          >
            Começar configuração
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Pular por agora
          </button>
        </div>
      </div>
    )
  }

  // ── DONE ──────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 mb-2">
            <Check className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            {tenantName} está pronta! 🚀
          </h2>
          <p className="text-zinc-400">
            Sua barbearia já está configurada. Compartilhe seu link de agendamento online com seus clientes.
          </p>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Seu link de agendamento</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={bookingUrl}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 font-mono"
              />
              <button
                onClick={handleCopy}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Copiar link"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-xl bg-amber-500 py-3.5 text-base font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
          >
            Ir para o dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN WIZARD ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Step indicator */}
        <div className="flex items-start justify-center gap-4 mb-8">
          {STEPS.filter((s) => s.key !== 'welcome').map((s, i, arr) => (
            <div key={s.key} className="flex items-center">
              <StepDot
                Icon={s.icon}
                label={s.label}
                current={s.key === step}
                done={STEPS.findIndex((x) => x.key === s.key) < stepIdx}
              />
              {i < arr.length - 1 && (
                <div className="h-px w-8 bg-zinc-800 mt-[-18px] mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ── TENANT ── */}
          {step === 'tenant' && (
            <form
              action={async (fd) => {
                setError('')
                startTransition(async () => {
                  try {
                    await updateTenant(fd)
                    setStep('barber')
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Erro ao salvar')
                  }
                })
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Dados da barbearia</h2>
                <p className="text-sm text-zinc-500 mt-1">Essas informações aparecem para seus clientes.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome da barbearia *</label>
                <input
                  name="name"
                  defaultValue={tenantName}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp / Telefone</label>
                <input
                  name="phone"
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Cidade</label>
                  <input
                    name="city"
                    placeholder="São Paulo"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Estado</label>
                  <select name="state" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none">
                    <option value="">Selecione</option>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continuar
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── BARBER ── */}
          {step === 'barber' && (
            <form
              action={async (fd) => {
                setError('')
                startTransition(async () => {
                  try {
                    await createBarber(fd)
                    setStep('service')
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Erro ao criar barbeiro')
                  }
                })
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Adicione o primeiro barbeiro</h2>
                <p className="text-sm text-zinc-500 mt-1">Você pode adicionar mais depois em Configurações.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome *</label>
                <input
                  name="name"
                  required
                  placeholder="Ex: João Silva"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp (opcional)</label>
                <input
                  name="phone"
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Comissão (%)</label>
                <input
                  name="commission_pct"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('tenant')}
                  className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* ── SERVICE ── */}
          {step === 'service' && (
            <form
              action={async (fd) => {
                setError('')
                startTransition(async () => {
                  try {
                    await createService(fd)
                    setStep('done')
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Erro ao criar serviço')
                  }
                })
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Crie o primeiro serviço</h2>
                <p className="text-sm text-zinc-500 mt-1">Ex: Corte de cabelo, Barba, Combo...</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do serviço *</label>
                <input
                  name="name"
                  required
                  placeholder="Ex: Corte masculino"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Preço (R$) *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="45.00"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duração (min) *</label>
                  <select name="duration" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none">
                    {[15, 30, 45, 60, 75, 90, 120].map((d) => (
                      <option key={d} value={d} selected={d === 30}>{d} min</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Emoji / Ícone (opcional)</label>
                <input
                  name="icon"
                  placeholder="✂️"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('barber')}
                  className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Concluir configuração 🎉
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
