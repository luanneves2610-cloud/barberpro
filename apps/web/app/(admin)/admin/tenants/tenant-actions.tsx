'use client'

import { useTransition, useState } from 'react'
import { MoreHorizontal, ShieldOff, ShieldCheck, Star } from 'lucide-react'
import { updateTenantAdmin } from '@/lib/actions/admin'

interface Props {
  tenantId: string
  currentStatus: string
  currentPlan: string
}

export function AdminTenantActions({ tenantId, currentStatus, currentPlan }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function doAction(action: string, value: string) {
    setOpen(false)
    startTransition(async () => {
      await updateTenantAdmin(tenantId, action, value)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        disabled={isPending}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-48 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Plano</p>
            {(['BASIC', 'PRO', 'ENTERPRISE'] as const).filter((p) => p !== currentPlan).map((p) => (
              <button
                key={p}
                onClick={() => doAction('plan', p)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
              >
                <Star className="h-3.5 w-3.5 text-amber-400" />
                Mudar para {p}
              </button>
            ))}
            <div className="my-1 border-t border-zinc-800" />
            <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Status</p>
            {currentStatus === 'ACTIVE' ? (
              <button
                onClick={() => doAction('status', 'SUSPENDED')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors text-left"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Suspender
              </button>
            ) : (
              <button
                onClick={() => doAction('status', 'ACTIVE')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-zinc-800 transition-colors text-left"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Reativar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
