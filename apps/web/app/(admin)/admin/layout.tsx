import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { Scissors, LayoutDashboard, Users, CreditCard, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Barbearias', Icon: Scissors },
    { href: '/admin/usuarios', label: 'Usuários', Icon: Users },
    { href: '/admin/assinaturas', label: 'Assinaturas', Icon: CreditCard },
  ]

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">BarberPro</p>
            <p className="text-[10px] text-red-400 font-medium">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2">
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <p className="text-xs text-zinc-500 px-2 truncate">{profile.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  )
}
