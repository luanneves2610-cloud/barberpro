import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { Avatar } from '@barberpro/ui'
import { StatusBadge } from '@/components/ui/status-badge'
import { NotesEditor } from './notes-editor'
import { ClientEditWrapper } from './client-edit-wrapper'
import {
  ChevronLeft, Phone, Mail, Calendar, Scissors,
  DollarSign, Target, User, MessageCircle, Star,
} from 'lucide-react'
import type { AppointmentStatus } from '@barberpro/types'

export const metadata: Metadata = { title: 'Perfil do Cliente' }

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}

export default async function ClientePerfilPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const client = await prisma.client.findUnique({
    where: { id: params.id, tenant_id: profile.tenant_id },
    include: {
      appointments: {
        include: {
          service: { select: { name: true, icon: true } },
          barber: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      },
    },
  })

  if (!client) notFound()

  const completed = client.appointments.filter((a) => a.status === 'COMPLETED')
  const totalSpent = completed.reduce((s, a) => s + Number(a.price), 0)
  const avgTicket = completed.length > 0 ? totalSpent / completed.length : 0
  const lastVisit = completed[0]?.date ?? null

  // Serviço favorito
  const serviceCount: Record<string, { name: string; count: number }> = {}
  for (const a of completed) {
    if (!serviceCount[a.service_id]) {
      serviceCount[a.service_id] = { name: a.service.name, count: 0 }
    }
    serviceCount[a.service_id].count++
  }
  const favoriteService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0]

  // Barbeiro favorito
  const barberCount: Record<string, { name: string; count: number }> = {}
  for (const a of completed) {
    if (!barberCount[a.barber_id]) {
      barberCount[a.barber_id] = { name: a.barber.name, count: 0 }
    }
    barberCount[a.barber_id].count++
  }
  const favoriteBarber = Object.values(barberCount).sort((a, b) => b.count - a.count)[0]

  // Avaliações que o cliente deixou
  const ratedAppointments = completed.filter((a) => a.rating !== null)
  const avgRating =
    ratedAppointments.length > 0
      ? ratedAppointments.reduce((s, a) => s + (a.rating ?? 0), 0) / ratedAppointments.length
      : null

  // Serializa client para passar ao ClientEditWrapper (plain object)
  const clientSerialized = {
    id: client.id,
    tenant_id: client.tenant_id,
    user_id: client.user_id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    birth_date: client.birth_date?.toISOString() ?? null,
    avatar_url: client.avatar_url,
    notes: client.notes,
    is_active: client.is_active,
    created_at: client.created_at.toISOString(),
    updated_at: client.updated_at.toISOString(),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Voltar para Clientes
      </Link>

      {/* Header do perfil */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={client.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-100">{client.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              {client.phone && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </div>
              )}
              {client.birth_date && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(client.birth_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {client.phone && (
              <a
                href={whatsappLink(client.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-700/50 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
            <ClientEditWrapper client={clientSerialized} />
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                client.is_active
                  ? 'bg-green-500/15 text-green-400 ring-green-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
              ].join(' ')}
            >
              {client.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          {
            label: 'Total de visitas',
            value: client.appointments.length,
            Icon: Calendar,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Visitas concluídas',
            value: completed.length,
            Icon: Scissors,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Total gasto',
            value: fmtCurrency(totalSpent),
            Icon: DollarSign,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Ticket médio',
            value: avgTicket > 0 ? fmtCurrency(avgTicket) : '—',
            Icon: Target,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Última visita',
            value: lastVisit
              ? new Date(lastVisit).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
              : '—',
            Icon: Calendar,
            color: 'text-zinc-300',
            bg: 'bg-zinc-700/50',
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3"
          >
            <div className={`rounded-lg p-2 ${bg} shrink-0`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 mb-0.5">{label}</p>
              <p className="text-sm font-bold text-zinc-100 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Favoritos + Avaliação */}
      {(favoriteService || favoriteBarber || avgRating !== null) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {favoriteService && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 shrink-0">
                <Scissors className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 mb-0.5">Serviço favorito</p>
                <p className="text-sm font-semibold text-zinc-100 truncate">
                  {favoriteService.name}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    ({favoriteService.count}×)
                  </span>
                </p>
              </div>
            </div>
          )}

          {favoriteBarber && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 shrink-0">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 mb-0.5">Barbeiro favorito</p>
                <p className="text-sm font-semibold text-zinc-100 truncate">
                  {favoriteBarber.name}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    ({favoriteBarber.count}×)
                  </span>
                </p>
              </div>
            </div>
          )}

          {avgRating !== null && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2 shrink-0">
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 mb-0.5">Avaliação média</p>
                <p className="text-sm font-semibold text-zinc-100">
                  {avgRating.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    / 5 ({ratedAppointments.length} aval.)
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Observações inline */}
      <NotesEditor clientId={client.id} initialNotes={client.notes ?? null} />

      {/* Histórico de agendamentos */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">
            Histórico de Agendamentos
            <span className="ml-2 text-xs font-normal text-zinc-500">
              ({client.appointments.length})
            </span>
          </h2>
          {completed.length > 0 && (
            <span className="text-xs text-zinc-500">
              {completed.length} concluído{completed.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {client.appointments.length === 0 ? (
          <div className="bg-zinc-900/50 py-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">Nenhum agendamento ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Serviço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">
                    Barbeiro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">
                    Avaliação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                {client.appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-200">
                        {new Date(a.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-zinc-500">{a.start_time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-200">
                        {a.service.icon ? `${a.service.icon} ` : ''}
                        {a.service.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-zinc-400">{a.barber.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-zinc-100">
                        {fmtCurrency(Number(a.price))}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {a.rating !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm text-zinc-300">{a.rating}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status as AppointmentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
