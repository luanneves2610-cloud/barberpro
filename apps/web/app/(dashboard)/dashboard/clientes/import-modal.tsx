'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { Button } from '@barberpro/ui'
import { Modal } from '@/components/ui/modal'
import { importClients } from '@/lib/actions/clients'

interface ParsedRow {
  name: string
  phone: string
  email: string
  birth_date: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

interface Props {
  open: boolean
  onClose: () => void
}

// Parse CSV (vírgula ou ponto-e-vírgula como separador, com ou sem BOM)
function parseCSV(text: string): ParsedRow[] {
  const clean = text.replace(/^\uFEFF/, '').trim()
  const lines = clean.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // Detect separator
  const sep = lines[0].includes(';') ? ';' : ','

  // Header mapping (case-insensitive)
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase()
    .replace(/[áàâã]/g, 'a').replace(/[éêè]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[óôõò]/g, 'o')
    .replace(/[úù]/g, 'u').replace(/ç/g, 'c')
  )

  const colIndex = (candidates: string[]) =>
    candidates.reduce<number>((found, c) => found >= 0 ? found : headers.indexOf(c), -1)

  const nameIdx = colIndex(['nome', 'name', 'cliente'])
  const phoneIdx = colIndex(['telefone', 'phone', 'celular', 'whatsapp', 'tel'])
  const emailIdx = colIndex(['email', 'e-mail'])
  const birthIdx = colIndex(['nascimento', 'birth_date', 'data_nascimento', 'aniversario', 'birthday'])

  if (nameIdx < 0) return []

  return lines.slice(1).map((line) => {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
    return {
      name: cols[nameIdx] ?? '',
      phone: phoneIdx >= 0 ? (cols[phoneIdx] ?? '') : '',
      email: emailIdx >= 0 ? (cols[emailIdx] ?? '') : '',
      birth_date: birthIdx >= 0 ? (cols[birthIdx] ?? '') : '',
    }
  }).filter((r) => r.name.trim())
}

export function ImportModal({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(file: File) {
    setParseError('')
    setResult(null)
    setRows([])
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setParseError('Nenhuma linha válida encontrada. Verifique o formato do arquivo.')
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleImport() {
    startTransition(async () => {
      const res = await importClients(rows)
      setResult(res)
      setRows([])
      setFileName('')
    })
  }

  function handleClose() {
    setRows([])
    setFileName('')
    setParseError('')
    setResult(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar clientes via CSV" size="lg">
      <div className="space-y-4">

        {/* Instructions */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 flex gap-2">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-300 space-y-1">
            <p className="font-medium">Formato esperado (CSV com cabeçalho):</p>
            <p className="font-mono bg-zinc-900/60 rounded px-2 py-1 text-zinc-300">
              nome;telefone;email;nascimento
            </p>
            <p>Separador: <strong>vírgula</strong> ou <strong>ponto-e-vírgula</strong>. Data: DD/MM/AAAA ou AAAA-MM-DD.</p>
            <p>Clientes com mesmo telefone já cadastrado serão ignorados.</p>
          </div>
        </div>

        {/* Download template link */}
        <a
          href="data:text/csv;charset=utf-8,%EF%BB%BFnome;telefone;email;nascimento%0AJoão Silva;11999990000;joao@email.com;15/03/1990%0AMaria Souza;11988880000;;%0A"
          download="modelo_clientes.csv"
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline"
        >
          <FileText className="h-3.5 w-3.5" /> Baixar modelo CSV
        </a>

        {/* Drop zone */}
        {!rows.length && !result && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 p-10 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/70 transition-colors"
          >
            <Upload className="h-8 w-8 text-zinc-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-xs text-zinc-500 mt-1">Somente arquivos .csv</p>
            </div>
            {fileName && <p className="text-xs text-amber-400">{fileName}</p>}
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {parseError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-300">
                Prévia — <span className="text-amber-400">{rows.length} cliente{rows.length !== 1 ? 's' : ''}</span> encontrado{rows.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => { setRows([]); setFileName('') }}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Limpar
              </button>
            </div>

            <div className="rounded-lg border border-zinc-800 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    {['Nome', 'Telefone', 'E-mail', 'Nascimento'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className={!r.name ? 'opacity-40' : ''}>
                      <td className="px-3 py-2 text-zinc-200">{r.name || <span className="text-red-400">— em branco</span>}</td>
                      <td className="px-3 py-2 text-zinc-400">{r.phone || '—'}</td>
                      <td className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-zinc-400">{r.birth_date || '—'}</td>
                    </tr>
                  ))}
                  {rows.length > 50 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-center text-zinc-500">
                        … e mais {rows.length - 50} registros
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setRows([]); setFileName('') }}>
                Cancelar
              </Button>
              <Button onClick={handleImport} loading={isPending}>
                Importar {rows.length} cliente{rows.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="font-semibold text-zinc-100">Importação concluída</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.created}</p>
                  <p className="text-xs text-zinc-400">importado{result.created !== 1 ? 's' : ''}</p>
                </div>
                <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-center">
                  <p className="text-2xl font-bold text-zinc-400">{result.skipped}</p>
                  <p className="text-xs text-zinc-500">ignorado{result.skipped !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-red-400">Avisos:</p>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-red-300/80">{e}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-red-300/60">… e mais {result.errors.length - 5}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
