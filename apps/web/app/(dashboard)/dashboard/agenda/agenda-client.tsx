'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Plus, UserCheck, RefreshCw } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Avatar } from '@barberpro/ui'
import { StatusBadge } from '@/components/ui/status-badge'
import { CheckoutModal } from '@/components/dashboard/checkout-modal'
import { updateAppointmentStatus, cancelAppointment } from '@/lib/actions/appointments'
import type { Appointment, Barber, Service, Client } from '@barberpro/types'

type FullAppointment = Appointment & { client: Client; barber: Barber; service: Service }

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
}

interface AgendaClientProps {
  appointments: FullAppointment[]
  barbers: Barber[]
  services: Service[]
  clients: Client[]
  products: Product[]
  date: string
  metrics: { total: number; completed: number; inProgress: number; revenue: number }
  onNewAppointment?: () => void
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AgendaClient({ appointments, products, onNewAppointment }: AgendaClientProps) {
  const router = useRouter()
  const [checkoutAppt, setCheckoutAppt] = useState<FullAppointment | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      {appointments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-400">Nenhum agendamento para este dia</p>
          {onNewAppointment && (
            <Button size="sm" className="mt-4" onClick={onNewAppointment}>
              <Plus className="h-4 w-4" /> Criar agendamento
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Horário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Serviço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden lg:table-cell">Barbeiro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{appt.start_time}</p>
                    <p className="text-xs text-zinc-500">{appt.end_time}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={appt.client.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{appt.client.name}</p>
                        {appt.client.phone && (
                          <p className="text-xs text-zinc-500">{appt.client.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-zinc-300">
                      {appt.service.icon ?? ''} {appt.service.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={appt.barber.name} size="sm" />
                      <span className="text-sm text-zinc-300">{appt.barber.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-100">
                      {fmtCurrency(Number(appt.price))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={appt.status} />
                      {appt.confirmed_at && appt.status === 'SCHEDULED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400">
                          <UserCheck className="h-3 w-3" /> Confirmado
                        </span>
                      )}
                      {appt.recurrence_group_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                          <RefreshCw className="h-3 w-3" /> Recorrente
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {appt.status === 'SCHEDULED' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Iniciar atendimento"
                            loading={isPending}
                            onClick={() => startTransition(() => updateAppointmentStatus(appt.id, 'IN_PROGRESS'))}
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cancelar"
                            loading={isPending}
                            onClick={() => startTransition(() => cancelAppointment(appt.id))}
                          >
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </>
                      )}
                      {appt.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Finalizar e cobrar (PDV)"
                          onClick={() => setCheckoutAppt(appt)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {checkoutAppt && (
        <CheckoutModal
          appointment={{
            id: checkoutAppt.id,
            clientName: checkoutAppt.client.name,
            serviceName: checkoutAppt.service.name,
            price: Number(checkoutAppt.price),
            barberName: checkoutAppt.barber.name,
          }}
          products={products}
          onClose={() => setCheckoutAppt(null)}
          onSuccess={() => {
            setCheckoutAppt(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
