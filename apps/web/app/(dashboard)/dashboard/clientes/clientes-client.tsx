'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, Users, Phone, Pencil, Eye, Cake,
  ChevronLeft, ChevronRight, Download, Upload,
} from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Avatar } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { ClientForm } from './client-form'
import { ImportModal } from './import-modal'
import { toggleClientStatus } from '@/lib/actions/clients'
import type { Client } from '@barberpro/types'

type ClientWithCount = Client & { totalAppointments: number; birthdaySoon: boolean }

interface Props {
  clients: ClientWithCount[]
  initialSearch: string
  initialFilter: string
  page: number
  totalPages: number
  total: number
}

const FILTER_OPTIONS = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
]

export function ClientesClient({
  clients,
  initialSearch,
  initialFilter,
  page,
  totalPages,
  total,
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<ClientWithCount | null>(null)
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter)
  const [isPending, startTransition] = useTransition()

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c: ClientWithCount) { setEditing(c); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null) }

  function buildUrl(params: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (params.q) p.set('q', String(params.q))
    if (params.page && Number(params.page) > 1) p.set('page', String(params.page))
    if (params.filter && params.filter !== 'active') p.set('filter', String(params.filter))
    const qs = p.toString()
    return `/dashboard/clientes${qs ? `?${qs}` : ''}`
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      router.push(buildUrl({ q: search, filter }))
    })
  }

  function handleFilter(f: string) {
    setFilter(f)
    startTransition(() => {
      router.push(buildUrl({ q: search, filter: f }))
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, telefone ou email..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" loading={isPending}>Buscar</Button>
        </form>

        {/* Filter tabs */}
        <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800 p-0.5 gap-0.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilter(opt.value)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === opt.value
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-100',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Export */}
        <a
          href={`/api/export/clientes?q=${encodeURIComponent(search)}&filter=${filter}`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </a>

        <button
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" /> Importar CSV
        </button>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={initialSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={initialSearch ? 'Tente outro termo de busca' : 'Cadastre os clientes da sua barbearia'}
          action={!initialSearch ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Cadastrar</Button> : undefined}
        />
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Atend.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-zinc-100 truncate max-w-[120px] sm:max-w-none">{client.name}</span>
                          {client.birthdaySoon && (
                            <span title="Aniversário esta semana!">
                              <Cake className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {client.phone ? (
                      <div className="flex items-center gap-1 text-sm text-zinc-300">
                        <Phone className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-zinc-400 truncate max-w-[160px] block">{client.email ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-100">{client.totalAppointments}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      client.is_active
                        ? 'bg-green-500/15 text-green-400 ring-green-500/30'
                        : 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
                    ].join(' ')}>
                      {client.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/clientes/${client.id}`}>
                        <Button size="sm" variant="ghost" title="Ver perfil">
                          <Eye className="h-3.5 w-3.5 text-amber-400" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => openEdit(client)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={isPending}
                        title={client.is_active ? 'Desativar' : 'Reativar'}
                        onClick={() => startTransition(() => toggleClientStatus(client.id))}
                        className={client.is_active ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-500 hover:text-green-400'}
                      >
                        {client.is_active ? '✕' : '✓'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-3">
              <p className="text-xs text-zinc-500">
                Página {page} de {totalPages} · {total} clientes
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildUrl({ q: search, filter, page: page - 1 })}
                  aria-disabled={page <= 1}
                  className={[
                    'inline-flex items-center justify-center rounded-lg border border-zinc-700 p-1.5 transition-colors',
                    page <= 1
                      ? 'pointer-events-none opacity-30 bg-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100',
                  ].join(' ')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  return (
                    <Link
                      key={p}
                      href={buildUrl({ q: search, filter, page: p })}
                      className={[
                        'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors border',
                        p === page
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100',
                      ].join(' ')}
                    >
                      {p}
                    </Link>
                  )
                })}
                <Link
                  href={buildUrl({ q: search, filter, page: page + 1 })}
                  aria-disabled={page >= totalPages}
                  className={[
                    'inline-flex items-center justify-center rounded-lg border border-zinc-700 p-1.5 transition-colors',
                    page >= totalPages
                      ? 'pointer-events-none opacity-30 bg-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100',
                  ].join(' ')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
      >
        <ClientForm client={editing ?? undefined} onSuccess={closeModal} />
      </Modal>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
