import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden pt-0">
      {/* Image area with 5 photo indicator dots */}
      <div className="relative aspect-4/3">
        <Skeleton className="size-full rounded-none" />
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="bg-foreground/20 size-1.5 rounded-full" />
          ))}
        </div>
      </div>
      {/* Title + City + Badges */}
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      {/* Availability */}
      <CardContent>
        <Skeleton className="h-4 w-36" />
      </CardContent>
      {/* Footer */}
      <CardFooter className="mt-auto justify-between border-t">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}

export default function DiscoverLoading() {
  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Filters panel skeleton */}
      <div className="space-y-4">
        {/* Header row: sort + toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-[200px] rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md md:hidden" />
        </div>
        {/* Filter grid (hidden on mobile by default, visible on md+) */}
        <div className="hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Room cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
