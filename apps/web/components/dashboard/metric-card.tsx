import type { LucideIcon } from 'lucide-react'

type Color = 'amber' | 'green' | 'blue' | 'purple'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: Color
}

const colorMap: Record<Color, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'amber',
}: MetricCardProps) {
  const { bg, text } = colorMap[color]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        <div className={['rounded-lg p-2', bg].join(' ')}>
          <Icon className={['h-4 w-4', text].join(' ')} />
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}
