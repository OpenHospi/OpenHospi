import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-5 w-64" />
      </div>
      <Separator />
      <div className="-mx-4 flex h-full flex-1 flex-col gap-6 lg:flex-row">
        {/* Desktop: vertical nav skeleton */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <nav className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </nav>
        </aside>

        {/* Mobile: select dropdown skeleton */}
        <div className="px-4 lg:hidden">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Content skeleton — matches GeneralSettings cards */}
        <div className="flex-1">
          <div className="max-w-2xl space-y-6 px-4 pb-6 lg:pr-4">
            {/* Push notifications card */}
            <div className="rounded-xl border p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-4 w-64" />
              <Skeleton className="mt-4 h-10 w-48" />
            </div>
            {/* Calendar card */}
            <div className="rounded-xl border p-6">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="mt-1 h-4 w-72" />
              <Skeleton className="mt-4 h-10 w-full rounded-md" />
              <Skeleton className="mt-2 h-3 w-56" />
              <Skeleton className="mt-4 h-10 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
