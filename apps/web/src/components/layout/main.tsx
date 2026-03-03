import { cn } from "@/lib/utils";

type MainProps = React.ComponentProps<"div"> & {
  fixed?: boolean;
  fluid?: boolean;
};

export function Main({ fixed, fluid, className, ...props }: MainProps) {
  return (
    <div
      role="main"
      data-layout={fixed ? "fixed" : undefined}
      className={cn(
        "px-4 py-6",
        fixed && "flex grow flex-col overflow-hidden",
        !fixed && "flex-1 overflow-auto",
        !fluid && "container",
        className,
      )}
      {...props}
    />
  );
}
