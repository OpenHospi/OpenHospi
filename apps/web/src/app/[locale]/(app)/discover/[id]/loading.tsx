import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Photo gallery */}
      <Skeleton className="aspect-video w-full rounded-xl" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title + location */}
          <div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="mt-2 h-5 w-1/2" />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Description */}
          <div>
            <Skeleton className="h-6 w-32" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Details grid */}
          <div>
            <Skeleton className="h-6 w-24" />
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-4 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <Skeleton className="h-6 w-24" />
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          {/* Owner card */}
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Skeleton className="size-12 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Cost breakdown card */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-8 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
