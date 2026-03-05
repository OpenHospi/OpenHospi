import { cn } from "@/lib/utils";

type MainProps = React.ComponentProps<"div"> & {
  scrollable?: boolean;
};

export function Main({ scrollable = false, className, children, ...props }: MainProps) {
  return (
    <div
      role="main"
      className={cn("flex flex-1 flex-col", scrollable && "overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}
