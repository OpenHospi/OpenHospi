import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ScrollArea } from "@/components/ui/scroll-area";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getConversations } from "@/lib/queries/chat";

import { ConversationList } from "./conversation-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.chat" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const conversations = await getConversations(user.id);
  const t = await getTranslations("app.chat");

  return (
    <>
      {/* Mobile-only: show list */}
      <div className="flex flex-1 flex-col md:hidden">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="font-semibold">{t("title")}</h2>
        </div>
        <ScrollArea className="flex-1">
          <ConversationList conversations={conversations} currentUserId={user.id} />
        </ScrollArea>
      </div>
      {/* Desktop: placeholder */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <p className="text-muted-foreground">{t("selectConversation")}</p>
      </div>
    </>
  );
}
