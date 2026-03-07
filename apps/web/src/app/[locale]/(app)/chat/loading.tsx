import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <>
      {/* Mobile-only: conversation list */}
      <div className="flex flex-1 flex-col md:hidden">
        <div className="flex h-14 items-center border-b px-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex-1 divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              {/* Avatar */}
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="mt-1 h-3.5 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: placeholder */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <Skeleton className="h-5 w-48" />
      </div>
    </>
  );
}
