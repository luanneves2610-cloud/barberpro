import type { AppointmentStatus } from '@barberpro/types'

const config: Record<AppointmentStatus, { label: string; className: string }> = {
  SCHEDULED:   { label: 'Agendado',       className: 'bg-blue-500/15 text-blue-400 ring-blue-500/30' },
  IN_PROGRESS: { label: 'Em andamento',   className: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  COMPLETED:   { label: 'Concluído',      className: 'bg-green-500/15 text-green-400 ring-green-500/30' },
  CANCELLED:   { label: 'Cancelado',      className: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  NO_SHOW:     { label: 'Não compareceu', className: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = config[status]
  return (
    <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className].join(' ')}>
      {label}
    </span>
  )
}
