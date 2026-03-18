import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex w-full">
      <div className="border-border flex w-full flex-col border-r md:w-80 lg:w-96">
        <div className="border-border border-b p-4">
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="flex flex-col gap-1 p-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
