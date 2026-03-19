import { cn } from "@/lib/utils";

export function Main({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main className={cn("flex flex-1 flex-col overflow-auto p-4 md:p-6", className)} {...props} />
  );
}
