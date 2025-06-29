import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function JobPostSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto mb-6 animate-pulse">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-16 h-8" />
          </div>
        </div>

        <div className="w-full text-left space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function JobFeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <JobPostSkeleton key={i} />
      ))}
    </div>
  )
}
