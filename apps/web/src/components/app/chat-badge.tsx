"use client";

import { Badge } from "@/components/ui/badge";

type Props = {
  count: number;
};

export function ChatBadge({ count }: Props) {
  if (count <= 0) return null;

  return (
    <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 font-medium">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
