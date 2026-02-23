import type { LucideIcon } from "lucide-react";

interface StepListProps {
  steps: { title: string; description: string }[];
  icons: LucideIcon[];
}

export function StepList({ steps, icons }: StepListProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => {
        const Icon = icons[i];
        return (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </div>
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}
