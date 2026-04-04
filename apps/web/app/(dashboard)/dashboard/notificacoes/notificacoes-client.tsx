'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '@/lib/actions/notifications'
import { useToast } from '@/components/ui/toast'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

interface Props {
  notifications: NotificationItem[]
  totalUnread: number
  filter: string
}

const TYPE_ICON: Record<string, string> = {
  PAYMENT_RECEIVED: '💰',
  APPOINTMENT_CONFIRMED: '📅',
  APPOINTMENT_CANCELLED: '❌',
  APPOINTMENT_REMINDER: '⏰',
  SYSTEM: '🔔',
}

const TYPE_LABEL: Record<string, string> = {
  PAYMENT_RECEIVED: 'Pagamento',
  APPOINTMENT_CONFIRMED: 'Agendamento',
  APPOINTMENT_CANCELLED: 'Cancelamento',
  APPOINTMENT_REMINDER: 'Lembrete',
  SYSTEM: 'Sistema',
}

const TYPE_COLOR: Record<string, string> = {
  PAYMENT_RECEIVED: 'bg-green-500/15 text-green-400 ring-green-500/30',
  APPOINTMENT_CONFIRMED: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  APPOINTMENT_CANCELLED: 'bg-red-500/15 text-red-400 ring-red-500/30',
  APPOINTMENT_REMINDER: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  SYSTEM: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'read', label: 'Lidas' },
]

export function NotificacoesClient({ notifications, totalUnread, filter }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    startTransition(async () => {
      try {
        await markNotificationAsRead(id)
      } catch {
        toastError('Erro ao atualizar notificação')
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead()
        success('Todas as notificações foram marcadas como lidas.')
      } catch {
        toastError('Erro ao marcar notificações')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteNotification(id)
      } catch {
        toastError('Erro ao excluir notificação')
      }
    })
  }

  function handleDeleteAllRead() {
    startTransition(async () => {
      try {
        await deleteAllReadNotifications()
        success('Notificações lidas removidas.')
      } catch {
        toastError('Erro ao limpar notificações')
      }
    })
  }

  const readCount = notifications.filter((n) => n.is_read).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => router.push(`/dashboard/notificacoes${value !== 'all' ? `?filter=${value}` : ''}`)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === value
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-100',
              ].join(' ')}
            >
              {label}
              {value === 'unread' && totalUnread > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={handleDeleteAllRead}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-700/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar lidas
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500">
        {notifications.length} notificação(ões)
        {totalUnread > 0 && ` · ${totalUnread} não lida(s)`}
      </p>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-400">Nenhuma notificação</p>
          <p className="text-xs text-zinc-600 mt-1">
            {filter === 'unread'
              ? 'Você está em dia!'
              : 'As notificações aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={[
                'flex items-start gap-4 px-5 py-4 transition-colors',
                n.is_read ? 'bg-zinc-900/40' : 'bg-amber-500/5 hover:bg-amber-500/8',
              ].join(' ')}
            >
              {/* Icon */}
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base',
                  n.is_read ? 'bg-zinc-800' : 'bg-amber-500/15',
                ].join(' ')}
              >
                {TYPE_ICON[n.type] ?? '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p
                    className={[
                      'text-sm font-medium',
                      n.is_read ? 'text-zinc-400' : 'text-zinc-100',
                    ].join(' ')}
                  >
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                      TYPE_COLOR[n.type] ?? 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
                    ].join(' ')}
                  >
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  <span className="text-[10px] text-zinc-600">{fmtRelative(n.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    disabled={isPending}
                    title="Marcar como lida"
                    className="rounded-lg p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={isPending}
                  title="Excluir"
                  className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
