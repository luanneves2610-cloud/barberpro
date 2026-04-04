'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, X, CheckCheck, Menu, Search } from 'lucide-react'
import { Avatar } from '@barberpro/ui'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import type { Profile, Tenant } from '@barberpro/types'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

interface HeaderProps {
  profile: Profile
  tenant: Tenant
  notifications: NotificationItem[]
  onMenuOpen?: () => void
  onSearchOpen?: () => void
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

const TYPE_ICON: Record<string, string> = {
  PAYMENT_RECEIVED: '💰',
  APPOINTMENT_CONFIRMED: '📅',
  APPOINTMENT_CANCELLED: '❌',
  APPOINTMENT_REMINDER: '⏰',
  SYSTEM: '🔔',
}

export function Header({ profile, tenant, notifications, onMenuOpen, onSearchOpen }: HeaderProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const unread = notifications.filter((n) => !n.is_read)

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 md:px-6 shrink-0">
      {/* Left: hamburger (mobile) + date */}
      <div className="flex items-center gap-2 md:gap-3">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-zinc-400">{dateStr}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-sm font-medium text-zinc-300">{timeStr}</span>
          <span className="ml-2 flex h-2 w-2 rounded-full bg-green-500" title="Online" />
        </div>
        {/* Search trigger */}
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors ml-2"
            title="Busca rápida (⌘K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Busca rápida</span>
            <kbd className="ml-1 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unread.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-100">
                    Notificações{' '}
                    {unread.length > 0 && (
                      <span className="text-amber-400">({unread.length})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    {unread.length > 0 && (
                      <button
                        title="Marcar todas como lidas"
                        disabled={isPending}
                        onClick={() => startTransition(() => markAllNotificationsAsRead())}
                        className="rounded p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setBellOpen(false)}
                      className="rounded p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="mx-auto h-6 w-6 text-zinc-700 mb-2" />
                      <p className="text-xs text-zinc-500">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={[
                          'flex gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0',
                          n.is_read ? 'opacity-60' : 'bg-amber-500/5',
                        ].join(' ')}
                      >
                        <span className="text-lg shrink-0">{TYPE_ICON[n.type] ?? '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-100 truncate">{n.title}</p>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">{fmtRelative(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            title="Marcar como lida"
                            disabled={isPending}
                            onClick={() => startTransition(() => markNotificationAsRead(n.id))}
                            className="shrink-0 rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors self-start"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {/* Footer — link to full page */}
                <div className="border-t border-zinc-800 px-4 py-2.5">
                  <Link
                    href="/dashboard/notificacoes"
                    onClick={() => setBellOpen(false)}
                    className="block text-center text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Ver todas as notificações →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {profile.avatar_url ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-700">
            <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <Avatar name={profile.name} size="sm" />
        )}
      </div>
    </header>
  )
}
