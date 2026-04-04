'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  label?: string
  hint?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'avatars',
  folder,
  label,
  hint,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)

    const form = new FormData()
    form.append('file', file)
    form.append('bucket', bucket)
    if (folder) form.append('folder', folder)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha no upload')
      onChange(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }, [bucket, folder, onChange])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none overflow-hidden',
          dragOver
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50',
          value ? 'h-32' : 'h-28',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-contain p-2"
              unoptimized
            />
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-xs text-zinc-100 font-medium">
                <Upload className="h-3.5 w-3.5" />
                Trocar imagem
              </div>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 z-10 rounded-full bg-zinc-900/80 p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-xs">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-400">
                Clique ou arraste a imagem aqui
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">PNG, JPG, WebP • máx. 5MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-zinc-500">{hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  )
}
