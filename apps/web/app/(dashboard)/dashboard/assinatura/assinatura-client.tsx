'use client'

import { useTransition } from 'react'
import { CheckCircle, XCircle, Zap, Crown, Star } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { createSubscriptionCheckout } from '@/lib/actions/subscription'
import { PLAN_CONFIG } from '@barberpro/types'
import type { Plan } from '@barberpro/types'

interface Props {
  currentPlan: Plan
  subscription: {
    id: string; plan: string; status: string; price: number
    billing_cycle: string; started_at: string; ends_at: string | null; trial_ends_at: string | null
  } | null
  usage: {
    barbers: { used: number; max: number | null }
    appointments: { used: number; max: number | null }
  }
  paymentStatus: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TRIALING: { label: 'Período de teste', color: 'text-amber-400' },
  ACTIVE: { label: 'Ativa', color: 'text-green-400' },
  PAST_DUE: { label: 'Pagamento pendente', color: 'text-red-400' },
  CANCELLED: { label: 'Cancelada', color: 'text-zinc-500' },
  SUSPENDED: { label: 'Suspensa', color: 'text-red-400' },
}

const PLAN_ICON: Record<Plan, React.ReactNode> = {
  BASIC: <Star className="h-5 w-5 text-zinc-400" />,
  PRO: <Zap className="h-5 w-5 text-amber-400" />,
  ENTERPRISE: <Crown className="h-5 w-5 text-purple-400" />,
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0
  const isUnlimited = max === null
  const isWarning = !isUnlimited && pct >= 80

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className={`text-xs font-medium ${isWarning ? 'text-amber-400' : 'text-zinc-200'}`}>
          {used} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function AssinaturaClient({ currentPlan, subscription, usage, paymentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  const plans: Plan[] = ['BASIC', 'PRO', 'ENTERPRISE']

  return (
    <div className="space-y-6">
      {/* Feedback de pagamento */}
      {paymentStatus === 'success' && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-300">Pagamento aprovado!</p>
            <p className="text-xs text-green-400/80">Sua assinatura foi ativada com sucesso.</p>
          </div>
        </div>
      )}
      {paymentStatus === 'failure' && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Pagamento não aprovado</p>
            <p className="text-xs text-red-400/80">Tente novamente ou use outra forma de pagamento.</p>
          </div>
        </div>
      )}

      {/* Status atual */}
      {subscription && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Plano atual</p>
              <div className="flex items-center gap-2">
                {PLAN_ICON[currentPlan]}
                <p className="text-lg font-bold text-zinc-100">
                  {PLAN_CONFIG[currentPlan].name}
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium ${STATUS_LABELS[subscription.status]?.color ?? 'text-zinc-400'}`}>
              {STATUS_LABELS[subscription.status]?.label ?? subscription.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-zinc-500">Valor mensal</p>
              <p className="text-sm font-semibold text-zinc-100">
                {subscription.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            {subscription.ends_at && (
              <div>
                <p className="text-xs text-zinc-500">Próxima cobrança</p>
                <p className="text-sm font-semibold text-zinc-100">
                  {new Date(subscription.ends_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            {subscription.trial_ends_at && (
              <div>
                <p className="text-xs text-zinc-500">Trial expira em</p>
                <p className="text-sm font-semibold text-amber-400">
                  {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Uso */}
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <p className="text-xs font-medium text-zinc-400 mb-2">Uso do plano (mês atual)</p>
            <UsageBar label="Barbeiros ativos" used={usage.barbers.used} max={usage.barbers.max} />
            <UsageBar label="Agendamentos" used={usage.appointments.used} max={usage.appointments.max} />
          </div>
        </div>
      )}

      {/* Cards de planos */}
      <div>
        <p className="text-sm font-semibold text-zinc-300 mb-4">
          {currentPlan === 'ENTERPRISE' ? 'Você está no plano máximo 🎉' : 'Fazer upgrade'}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const config = PLAN_CONFIG[plan]
            const isCurrent = plan === currentPlan
            const isDowngrade =
              (plan === 'BASIC' && (currentPlan === 'PRO' || currentPlan === 'ENTERPRISE')) ||
              (plan === 'PRO' && currentPlan === 'ENTERPRISE')

            return (
              <div
                key={plan}
                className={[
                  'rounded-xl border p-5 flex flex-col',
                  isCurrent
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-zinc-800 bg-zinc-900',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {PLAN_ICON[plan]}
                    <p className="font-semibold text-zinc-100">{config.name}</p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      Atual
                    </span>
                  )}
                </div>

                <p className="text-2xl font-bold text-zinc-100 mb-1">
                  R$ {config.price}
                  <span className="text-sm font-normal text-zinc-500">/mês</span>
                </p>

                <ul className="mt-3 mb-5 flex-1 space-y-1.5">
                  {config.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && !isDowngrade && (
                  <Button
                    size="sm"
                    loading={isPending}
                    onClick={() => startTransition(() => createSubscriptionCheckout(plan))}
                  >
                    Assinar {config.name}
                  </Button>
                )}
                {isCurrent && (
                  <div className="rounded-lg border border-zinc-700 py-2 text-center text-xs text-zinc-500">
                    Plano ativo
                  </div>
                )}
                {isDowngrade && (
                  <div className="rounded-lg border border-zinc-800 py-2 text-center text-xs text-zinc-600">
                    Plano inferior
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
