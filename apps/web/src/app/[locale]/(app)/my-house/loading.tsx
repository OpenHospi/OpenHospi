import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyHouseLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {/* House name */}
      <Skeleton className="h-8 w-48" />

      {/* Members card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-1 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Invite code card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1 h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full rounded" />
        </CardContent>
      </Card>

      {/* Rooms card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
