'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  Package, TrendingUp, TrendingDown, Settings, LogOut,
  BarChart2, CreditCard, UserCircle, MessageSquare, BadgeDollarSign, Plug, Star, Bell, Receipt,
} from 'lucide-react'
import { Avatar } from '@barberpro/ui'
import { logout } from '@/lib/auth/actions'
import type { Profile, Tenant } from '@barberpro/types'

interface SidebarProps {
  profile: Profile
  tenant: Tenant
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/servicos', label: 'Serviços', icon: Scissors },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package },
  { href: '/dashboard/caixa', label: 'Caixa do Dia', icon: Receipt },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: TrendingUp },
  { href: '/dashboard/despesas', label: 'Despesas', icon: TrendingDown },
  { href: '/dashboard/comissoes', label: 'Comissões', icon: BadgeDollarSign },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/dashboard/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/dashboard/marketing', label: 'Marketing', icon: MessageSquare },
  { href: '/dashboard/integracoes', label: 'Integrações', icon: Plug },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/dashboard/assinatura', label: 'Assinatura', icon: CreditCard },
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: UserCircle },
]

export function Sidebar({ profile, tenant }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
          <Scissors className="h-4 w-4 text-zinc-950" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">{tenant.name}</p>
          <p className="text-xs text-zinc-500 capitalize">{tenant.plan.toLowerCase()}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={profile.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{profile.name}</p>
            <p className="truncate text-xs text-zinc-500 capitalize">{profile.role.toLowerCase()}</p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded p-1 text-zinc-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
