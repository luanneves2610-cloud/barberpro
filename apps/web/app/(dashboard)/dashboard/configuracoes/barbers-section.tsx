'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Power, Star } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@barberpro/ui'
import { Avatar } from '@barberpro/ui'
import { Badge } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { BarberForm } from './barber-form'
import { toggleBarberStatus, deleteBarber } from '@/lib/actions/barbers'
import type { Barber } from '@barberpro/types'

export function BarbersSection({ barbers }: { barbers: Barber[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(b: Barber) { setEditing(b); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Equipe</h2>
          <p className="text-sm text-zinc-400">{barbers.length} barbeiro(s) cadastrado(s)</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Adicionar barbeiro
        </Button>
      </div>

      {barbers.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nenhum barbeiro cadastrado"
          description="Adicione os barbeiros da sua equipe"
          action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Adicionar</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {barbers.map((barber) => (
            <div key={barber.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {barber.avatar_url ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={barber.avatar_url}
                        alt={barber.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Avatar name={barber.name} size="md" />
                  )}
                  <div>
                    <p className="font-medium text-zinc-100">{barber.name}</p>
                    <p className="text-xs text-zinc-500">{barber.phone ?? barber.email ?? '—'}</p>
                  </div>
                </div>
                <Badge color={barber.is_active ? 'green' : 'zinc'}>
                  {barber.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-zinc-400">Comissão</span>
                <span className="font-medium text-zinc-100">{Number(barber.commission_pct)}%</span>
              </div>
              {barber.bio && (
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{barber.bio}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(barber)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => startTransition(() => toggleBarberStatus(barber.id))}
                  loading={isPending}
                >
                  <Power className="h-3.5 w-3.5" />
                  {barber.is_active ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar barbeiro' : 'Novo barbeiro'}
        description={editing ? `Editando ${editing.name}` : 'Preencha os dados do novo barbeiro'}
      >
        <BarberForm barber={editing ?? undefined} onSuccess={closeModal} />
      </Modal>
    </div>
  )
}
