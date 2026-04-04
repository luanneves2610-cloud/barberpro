import * as React from 'react'
import type { AppointmentStatus } from '@barberpro/types'

type BadgeColor = 'green' | 'amber' | 'blue' | 'red' | 'zinc' | 'purple'

interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
  className?: string
}

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-500/15 text-green-400 ring-green-500/30',
  amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  red: 'bg-red-500/15 text-red-400 ring-red-500/30',
  zinc: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  purple: 'bg-purple-500/15 text-purple-400 ring-purple-500/30',
}

export function Badge({ color = 'zinc', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        colorClasses[color],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export const appointmentStatusColor: Record<AppointmentStatus, BadgeColor> = {
  SCHEDULED: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'zinc',
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}
