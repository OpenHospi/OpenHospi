import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Stepper */}
      <nav className="px-2">
        <div className="flex items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`relative flex items-center ${i < 3 ? "flex-1" : ""}`}>
              <Skeleton className="z-10 size-9 shrink-0 rounded-full" />
              {i < 3 && <Skeleton className="mx-2 h-0.5 flex-1" />}
            </div>
          ))}
        </div>
      </nav>

      {/* Step content */}
      <div className="pt-6 sm:pt-8">
        {/* Step title + description */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>

        {/* Form fields */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
            <Skeleton className="mt-4 h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
