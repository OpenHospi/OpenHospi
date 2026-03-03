"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment, useMemo } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations();

  const items = useMemo(() => {
    // Remove locale prefix (e.g. /en, /nl, /de)
    const strippedPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    const segments = strippedPath.split("/").filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const href = "/" + segments.slice(0, i + 1).join("/");

      // Skip UUID-like segments — they'll be shown as part of the parent
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment)) continue;

      // Try translating the segment via breadcrumb namespace
      const key = `breadcrumbs.${segment}`;
      let label: string;
      try {
        label = t(key as Parameters<typeof t>[0]);
        // If the key wasn't found, next-intl returns the key itself
        if (label === key) {
          label = segment.replaceAll("-", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
        }
      } catch {
        label = segment.replaceAll("-", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
      }

      breadcrumbs.push({ label, href });
    }

    return breadcrumbs;
  }, [pathname, t]);

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
