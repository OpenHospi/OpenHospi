import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ApplicationCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Cover image area with status badge */}
      <div className="relative aspect-video">
        <Skeleton className="size-full rounded-none" />
        <Skeleton className="absolute top-2 right-2 h-5 w-16 rounded-full" />
      </div>
      {/* Title + city */}
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      {/* Price + applied date */}
      <CardContent className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

export default function ApplicationsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Skeleton className="h-8 w-48" />

      {/* Application cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
