import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function EnhancedJobSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card className="w-full max-w-md mx-auto mb-6 animate-pulse" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        {/* Avatar skeleton */}
        <div className="relative">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300" />
          <Skeleton className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Image skeleton with gradient */}
        <div className="aspect-square w-full relative overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />

          {/* Simulated content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
            <Skeleton className="h-8 w-48 bg-white/40" />
            <Skeleton className="h-6 w-32 bg-white/40" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3">
        {/* Action buttons skeleton */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-md" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="w-full text-left space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-5 w-40" />

          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>

          <Skeleton className="h-3 w-20" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function StaggeredJobFeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <EnhancedJobSkeleton key={i} delay={i * 150} />
      ))}
    </div>
  )
}

export function QuickLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="w-full max-w-md mx-auto animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-md mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
