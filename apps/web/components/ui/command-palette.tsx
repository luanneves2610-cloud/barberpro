'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, CalendarDays, Users, Scissors,
  Package, TrendingUp, TrendingDown, Settings, BarChart2,
  CreditCard, UserCircle, MessageSquare, BadgeDollarSign,
  Plug, X, ArrowRight, Loader2, Star, Bell, Receipt,
} from 'lucide-react'
import { searchClients } from '@/lib/actions/search'

// ── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Páginas' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays, group: 'Páginas' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, group: 'Páginas' },
  { href: '/dashboard/servicos', label: 'Serviços', icon: Scissors, group: 'Páginas' },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package, group: 'Páginas' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: TrendingUp, group: 'Páginas' },
  { href: '/dashboard/despesas', label: 'Despesas', icon: TrendingDown, group: 'Páginas' },
  { href: '/dashboard/comissoes', label: 'Comissões', icon: BadgeDollarSign, group: 'Páginas' },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, group: 'Páginas' },
  { href: '/dashboard/avaliacoes', label: 'Avaliações', icon: Star, group: 'Páginas' },
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell, group: 'Páginas' },
  { href: '/dashboard/caixa', label: 'Caixa do Dia', icon: Receipt, group: 'Páginas' },
  { href: '/dashboard/marketing', label: 'Marketing', icon: MessageSquare, group: 'Páginas' },
  { href: '/dashboard/integracoes', label: 'Integrações', icon: Plug, group: 'Páginas' },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, group: 'Páginas' },
  { href: '/dashboard/assinatura', label: 'Assinatura', icon: CreditCard, group: 'Páginas' },
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: UserCircle, group: 'Páginas' },
]

const QUICK_ACTIONS = [
  { href: '/dashboard/agenda?new=1', label: 'Novo agendamento', icon: CalendarDays, group: 'Ações rápidas' },
  { href: '/dashboard/clientes?new=1', label: 'Novo cliente', icon: Users, group: 'Ações rápidas' },
  { href: '/dashboard/financeiro?new=1', label: 'Lançar transação', icon: TrendingUp, group: 'Ações rápidas' },
  { href: '/dashboard/produtos?new=1', label: 'Novo produto', icon: Package, group: 'Ações rápidas' },
]

// ── Types ──────────────────────────────────────────────────────────────────

interface ClientResult {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ClientResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setClients([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search clients with debounce
  useEffect(() => {
    if (query.length < 2) { setClients([]); return }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchClients(query)
        setClients(results)
        setActiveIdx(0)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Build filtered result list
  const q = query.toLowerCase()
  const filteredNav = q
    ? NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(q))
    : NAV_ITEMS.slice(0, 6)
  const filteredActions = q
    ? QUICK_ACTIONS.filter((i) => i.label.toLowerCase().includes(q))
    : QUICK_ACTIONS

  // Flat list for keyboard navigation
  type ResultItem =
    | { kind: 'nav'; href: string; label: string; icon: React.ElementType; group: string }
    | { kind: 'action'; href: string; label: string; icon: React.ElementType; group: string }
    | { kind: 'client'; id: string; name: string; phone: string | null; email: string | null }

  const flatItems: ResultItem[] = [
    ...filteredActions.map((a) => ({ ...a, kind: 'action' as const })),
    ...filteredNav.map((n) => ({ ...n, kind: 'nav' as const })),
    ...clients.map((c) => ({ ...c, kind: 'client' as const })),
  ]

  function navigate(item: ResultItem) {
    if (item.kind === 'client') {
      router.push(`/dashboard/clientes/${item.id}`)
    } else {
      router.push(item.href)
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[activeIdx]
      if (item) navigate(item)
    }
  }

  if (!open) return null

  // Group rendering helpers
  let lastGroup = ''
  function renderGroup(group: string) {
    if (group === lastGroup) return null
    lastGroup = group
    return (
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {group}
      </div>
    )
  }

  let globalIdx = 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3.5">
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 text-zinc-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, clientes, ações..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {flatItems.length === 0 && query.length >= 2 && !isPending && (
            <div className="py-8 text-center text-sm text-zinc-500">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Ações rápidas
              </div>
              {filteredActions.map((item) => {
                const idx = globalIdx++
                const isActive = idx === activeIdx
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate({ ...item, kind: 'action' })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={[
                      'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                      isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-300 hover:bg-zinc-800',
                    ].join(' ')}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Nav pages */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mt-1">
                Páginas
              </div>
              {filteredNav.map((item) => {
                const idx = globalIdx++
                const isActive = idx === activeIdx
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate({ ...item, kind: 'nav' })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={[
                      'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                    ].join(' ')}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Client results */}
          {clients.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mt-1">
                Clientes
              </div>
              {clients.map((c) => {
                const idx = globalIdx++
                const isActive = idx === activeIdx
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate({ ...c, kind: 'client' })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={[
                      'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                      isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-300 hover:bg-zinc-800',
                    ].join(' ')}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                      {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{c.name}</p>
                      {(c.phone ?? c.email) && (
                        <p className="text-xs text-zinc-500">{c.phone ?? c.email}</p>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-zinc-800 px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-600">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> selecionar</span>
          <span><kbd className="font-mono">ESC</kbd> fechar</span>
          <span className="ml-auto">Digite ao menos 2 letras para buscar clientes</span>
        </div>
      </div>
    </>
  )
}
