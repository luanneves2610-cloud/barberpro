import { Skeleton } from '@/components/ui/skeleton'

export default function AvaliacoesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col items-center gap-3">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-4" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="flex-1 h-2 rounded-full" />
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <Skeleton className="h-4 w-40" />
        </div>
        {[1,2,3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800 last:border-0">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
