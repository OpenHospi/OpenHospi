import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden pt-0">
      {/* Cover image */}
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      {/* Title + city/status */}
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-3/4" />
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </CardDescription>
      </CardHeader>
      {/* Footer: price + applicant count */}
      <CardFooter className="mt-auto justify-between border-t">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-10" />
      </CardFooter>
    </Card>
  );
}

export default function MyRoomsLoading() {
  return (
    <div className="space-y-6">
      {/* Header: title + create button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Room cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
