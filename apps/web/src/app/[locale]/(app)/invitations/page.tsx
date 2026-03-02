import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getUserInvitations } from "@/lib/invitations";

import { InvitationCard } from "./invitation-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.invitations" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function InvitationsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const invitations = await getUserInvitations(user.id);
  const t = await getTranslations("app.invitations");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <InvitationCard key={invitation.invitationId} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
}
