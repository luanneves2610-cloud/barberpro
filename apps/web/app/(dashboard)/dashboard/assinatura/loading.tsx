import { Skeleton } from '@/components/ui/skeleton'

export default function AssinaturaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Plan card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-2 rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Plan options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1,2,3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-28" />
            <div className="space-y-2">
              {[1,2,3].map((j) => <Skeleton key={j} className="h-3 w-full" />)}
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
