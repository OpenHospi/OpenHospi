"use client";

import { RoomStatus } from "@openhospi/shared/enums";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, usePathname } from "@/i18n/navigation-app";

type Props = {
  roomId: string;
  roomStatus: RoomStatus;
  applicantCount: number;
};

export function RoomTabs({ roomId, roomStatus, applicantCount }: Props) {
  const t = useTranslations("app.rooms.manage.tabs");
  const pathname = usePathname();
  const basePath = `/my-rooms/${roomId}`;
  const isDraft = roomStatus === RoomStatus.draft;

  const tabs = [
    { value: "overview", href: basePath, label: t("overview") },
    ...(!isDraft
      ? [
          { value: "applicants", href: `${basePath}/applicants`, label: t("applicants") },
          { value: "events", href: `${basePath}/events`, label: t("events") },
          { value: "voting", href: `${basePath}/voting`, label: t("voting") },
        ]
      : []),
  ];

  // Determine active tab from pathname
  let activeTab = "overview";
  if (pathname.startsWith(`${basePath}/applicants`)) activeTab = "applicants";
  else if (pathname.startsWith(`${basePath}/events`)) activeTab = "events";
  else if (pathname.startsWith(`${basePath}/voting`)) activeTab = "voting";

  return (
    <Tabs value={activeTab}>
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link href={tab.href}>
              {tab.label}
              {tab.value === "applicants" && applicantCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {applicantCount}
                </Badge>
              )}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
