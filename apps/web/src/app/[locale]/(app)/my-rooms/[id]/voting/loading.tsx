import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Ranking section */}
      <div className="space-y-3">
        <div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>

        {/* Sortable applicant rows */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3">
              <Skeleton className="size-4" />
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="size-8 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
