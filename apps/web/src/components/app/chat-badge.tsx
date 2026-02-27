"use client";

type Props = {
  count: number;
};

export function ChatBadge({ count }: Props) {
  if (count <= 0) return null;

  return (
    <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
      {count > 99 ? "99+" : count}
    </span>
  );
}
