import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireSession } from "@/lib/auth-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.profile" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession(locale);

  const t = await getTranslations({ locale, namespace: "app.profile" });

  // Extract institution from the synthetic email domain (e.g., user-id@id.openhospi.nl)
  // The real institution comes from the profiles table, but for now we show user name
  const initials = (user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <p className="text-muted-foreground">{t("placeholder")}</p>
    </div>
  );
}
