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
import { Link } from "@/i18n/navigation-app";

import { useBreadcrumbLabels } from "./breadcrumb-store";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-/;

export function BreadcrumbsNav() {
  const pathname = usePathname();
  const t = useTranslations("breadcrumbs");
  const labels = useBreadcrumbLabels();

  const crumbs = useMemo(() => {
    const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    const segments = stripped.split("/").filter(Boolean);
    const result: { href: string; label: string }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const href = "/" + segments.slice(0, i + 1).join("/");

      if (UUID_RE.test(seg)) {
        // Skip unresolved UUIDs — they appear once SetBreadcrumb fires
        if (labels[seg]) result.push({ href, label: labels[seg] });
      } else {
        const translated = t(seg as Parameters<typeof t>[0]);
        const label =
          translated === `breadcrumbs.${seg}`
            ? seg.replaceAll("-", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase())
            : translated;
        result.push({ href, label });
      }
    }
    return result;
  }, [pathname, t, labels]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
