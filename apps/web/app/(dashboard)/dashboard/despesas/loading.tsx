import { TableSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function DespesasLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </div>
    </div>
  )
}
