import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-800/80',
        className,
      )}
      style={style}
    />
  )
}

// ── Page-level skeletons ──────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-end gap-3 h-32">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${30 + Math.random() * 70}%` } as any}
            />
          ))}
        </div>
      </div>
      {/* Table */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}

export function AgendaSkeleton() {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      {/* Timeline skeleton */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <div className="w-14 border-r border-zinc-800 py-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-zinc-800 last:border-r-0 px-3 py-3">
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="flex" style={{ height: 320 }}>
          <div className="w-14 border-r border-zinc-800" />
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col} className="flex-1 border-r border-zinc-800 last:border-r-0 relative p-2 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClientesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  )
}

export function FinanceiroSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="flex items-end gap-4 h-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton className="w-full rounded-t-md" style={{ height: `${20 + i * 15}%` } as any} />
              <Skeleton className="h-2 w-6" />
            </div>
          ))}
        </div>
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}

export function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* header */}
      <div className="flex gap-4 px-4 py-3 border-b border-zinc-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* rows */}
      <div className="divide-y divide-zinc-800/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'max-w-[140px]' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
