import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-8">
      {/* ProfileHeader: name + badges */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* PhotosGrid: 5 slots */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>

      {/* BioCard */}
      <div className="rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-3/4" />
      </div>

      {/* AboutCard + PreferencesCard side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* AboutCard */}
        <div className="rounded-xl border p-5">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-8 rounded-md" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-0.5 h-4 w-36" />
              </div>
            ))}
          </div>
        </div>

        {/* PreferencesCard */}
        <div className="rounded-xl border p-5">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-8 rounded-md" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-0.5 h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LanguagesCard */}
      <div className="rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* LifestyleCard */}
      <div className="rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
