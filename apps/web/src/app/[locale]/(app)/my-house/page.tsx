import { withRLS } from "@openhospi/database";
import { houseMembers, houses, profiles, rooms } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MyHousePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const session = await requireSession();
  const userId = session.user.id;

  const t = await getTranslations({ locale, namespace: "app.house" });
  const tRoles = await getTranslations({ locale, namespace: "enums.houseMemberRole" });

  const data = await withRLS(userId, async (tx) => {
    // Find house where user is a member
    const [membership] = await tx
      .select({ houseId: houseMembers.houseId })
      .from(houseMembers)
      .where(eq(houseMembers.userId, userId));

    if (!membership) return null;

    const [house] = await tx.select().from(houses).where(eq(houses.id, membership.houseId));

    if (!house) return null;

    const members = await tx
      .select({
        id: houseMembers.id,
        role: houseMembers.role,
        joinedAt: houseMembers.joinedAt,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(houseMembers)
      .innerJoin(profiles, eq(houseMembers.userId, profiles.id))
      .where(eq(houseMembers.houseId, house.id));

    const houseRooms = await tx
      .select({ id: rooms.id, title: rooms.title, status: rooms.status })
      .from(rooms)
      .where(eq(rooms.houseId, house.id));

    return { house, members, rooms: houseRooms };
  });

  if (!data) {
    return redirect({ href: "/my-house/create", locale });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{data.house.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("members.title")}</CardTitle>
          <CardDescription>{t("members.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-sm text-muted-foreground">{tRoles(member.role!)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {data.house.inviteCode && (
        <Card>
          <CardHeader>
            <CardTitle>{t("invite.title")}</CardTitle>
            <CardDescription>{t("invite.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block rounded bg-muted p-3 text-sm break-all">
              {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join/
              {data.house.inviteCode}
            </code>
          </CardContent>
        </Card>
      )}

      {data.rooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("rooms.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>{room.title || t("rooms.untitled")}</span>
                  <span className="text-sm text-muted-foreground">{room.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
