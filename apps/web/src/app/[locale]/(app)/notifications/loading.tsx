import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="space-y-6">
        {/* Title */}
        <Skeleton className="h-8 w-40" />

        <div className="space-y-4">
          {/* Mark all read button */}
          <div className="flex justify-end">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Notification items in a bordered list */}
          <div className="divide-y rounded-lg border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-1 h-3.5 w-full" />
                    <Skeleton className="mt-1.5 h-3 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
