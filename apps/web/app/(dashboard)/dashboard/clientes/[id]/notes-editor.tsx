'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, FileText } from 'lucide-react'
import { updateClientNotes } from '@/lib/actions/clients'
import { useToast } from '@/components/ui/toast'

export function NotesEditor({ clientId, initialNotes }: { clientId: string; initialNotes: string | null }) {
  const { success, error } = useToast()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updateClientNotes(clientId, value)
        success('Observação salva!')
        setEditing(false)
      } catch (err) {
        error(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  function handleCancel() {
    setValue(initialNotes ?? '')
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Observações</h3>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Preferências, alergias, observações importantes..."
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <p className={value ? 'text-sm text-zinc-300 whitespace-pre-wrap' : 'text-sm text-zinc-600 italic'}>
          {value || 'Nenhuma observação registrada. Clique em Editar para adicionar.'}
        </p>
      )}
    </div>
  )
}
