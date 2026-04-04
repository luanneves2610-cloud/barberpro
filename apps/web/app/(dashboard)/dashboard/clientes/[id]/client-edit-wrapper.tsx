'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ClientForm } from '../client-form'
import type { Client } from '@barberpro/types'

interface Props {
  client: Client
}

export function ClientEditWrapper({ client }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar cliente
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Editar cliente"
      >
        <ClientForm
          client={client}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}
