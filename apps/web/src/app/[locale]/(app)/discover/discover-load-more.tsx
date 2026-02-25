"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation-app";
import type { DiscoverCursor } from "@/lib/discover";

type Props = {
  nextCursor: DiscoverCursor;
  searchParams: Record<string, string>;
};

export function DiscoverLoadMore({ nextCursor, searchParams }: Props) {
  const t = useTranslations("app.discover");

  const href = {
    pathname: "/discover" as const,
    query: {
      ...searchParams,
      cursorCreatedAt: nextCursor.createdAt,
      cursorId: nextCursor.id,
    },
  };

  return (
    <div className="flex justify-center">
      <Button variant="outline" asChild>
        <Link href={href}>{t("loadMore")}</Link>
      </Button>
    </div>
  );
}
