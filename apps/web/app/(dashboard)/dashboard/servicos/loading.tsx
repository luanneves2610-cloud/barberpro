import { TableSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function ServicosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
