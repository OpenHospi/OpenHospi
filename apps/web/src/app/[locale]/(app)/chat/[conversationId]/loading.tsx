import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <div className="flex w-full flex-col">
      {/* Header skeleton */}
      <div className="border-border flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Messages skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-border border-t p-3">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
