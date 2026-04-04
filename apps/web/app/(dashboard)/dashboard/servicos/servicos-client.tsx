'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Power, Scissors, Copy, TrendingUp, Activity, CheckCircle2 } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Badge } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { ServiceForm } from './service-form'
import { toggleServiceStatus, duplicateService } from '@/lib/actions/services'
import type { Service } from '@barberpro/types'

type ServiceWithStats = Service & { usageCount: number; revenue: number }

interface Metrics {
  totalRevenue: number
  totalUsage: number
  activeCount: number
  totalCount: number
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function ServicosClient({
  services,
  metrics,
}: {
  services: ServiceWithStats[]
  metrics: Metrics
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(s: ServiceWithStats) { setEditing(s); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null) }

  const maxUsage = Math.max(...services.map((s) => s.usageCount), 1)

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Serviços ativos',
            value: `${metrics.activeCount} / ${metrics.totalCount}`,
            Icon: CheckCircle2,
            iconColor: 'text-green-400',
            bg: 'bg-green-500/10',
            color: 'text-zinc-100',
          },
          {
            label: 'Total de usos',
            value: metrics.totalUsage.toLocaleString('pt-BR'),
            Icon: Activity,
            iconColor: 'text-amber-400',
            bg: 'bg-amber-500/10',
            color: 'text-zinc-100',
          },
          {
            label: 'Receita total',
            value: fmtCurrency(metrics.totalRevenue),
            Icon: TrendingUp,
            iconColor: 'text-blue-400',
            bg: 'bg-blue-500/10',
            color: 'text-zinc-100',
          },
          {
            label: 'Ticket médio / serviço',
            value: metrics.totalUsage > 0
              ? fmtCurrency(metrics.totalRevenue / metrics.totalUsage)
              : fmtCurrency(0),
            Icon: TrendingUp,
            iconColor: 'text-purple-400',
            bg: 'bg-purple-500/10',
            color: 'text-zinc-100',
          },
        ].map(({ label, value, Icon, iconColor, bg, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${bg} shrink-0`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-400 mb-1">{label}</p>
              <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço cadastrado"
          description="Crie os serviços que sua barbearia oferece"
          action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Criar serviço</Button>}
        />
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Serviço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Duração</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Usos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Receita</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{service.icon ?? '✂️'}</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{fmtDuration(service.duration)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-100">{fmtCurrency(service.price)}</td>

                  {/* Usage bar */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/60"
                          style={{ width: `${(service.usageCount / maxUsage) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums">{service.usageCount}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-green-400 hidden md:table-cell">
                    {service.revenue > 0 ? fmtCurrency(service.revenue) : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <Badge color={service.is_active ? 'green' : 'zinc'}>
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(service)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Duplicar"
                        loading={isPending}
                        onClick={() => startTransition(() => duplicateService(service.id))}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={isPending}
                        onClick={() => startTransition(() => toggleServiceStatus(service.id))}
                        title={service.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
      >
        <ServiceForm service={editing ?? undefined} onSuccess={closeModal} />
      </Modal>
    </>
  )
}
