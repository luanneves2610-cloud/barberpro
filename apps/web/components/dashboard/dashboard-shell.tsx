'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { CommandPalette } from '@/components/ui/command-palette'
import type { Profile, Tenant } from '@barberpro/types'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

interface Props {
  profile: Profile
  tenant: Tenant
  notifications: NotificationItem[]
  children: React.ReactNode
}

export function DashboardShell({ profile, tenant, notifications, children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar — oculto em telas pequenas */}
      <div className="hidden md:flex shrink-0">
        <Sidebar profile={profile} tenant={tenant} />
      </div>

      {/* Mobile slide-over */}
      <MobileNav
        profile={profile}
        tenant={tenant}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          profile={profile}
          tenant={tenant}
          notifications={notifications}
          onMenuOpen={() => setMobileNavOpen(true)}
          onSearchOpen={() => setCmdOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
