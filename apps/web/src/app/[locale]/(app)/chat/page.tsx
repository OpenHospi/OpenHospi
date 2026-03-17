import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getConversations } from "@/lib/queries/chat";

import { ConversationList } from "./conversation-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.chat" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const session = await requireSession();
  const conversations = await getConversations(session.user.id);
  const t = await getTranslations("app.chat");

  return (
    <div className="flex w-full">
      {/* Sidebar: conversation list */}
      <div className="border-border flex w-full flex-col border-r md:w-80 lg:w-96">
        <div className="border-border border-b p-4">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
        </div>
        <ConversationList conversations={conversations} currentUserId={session.user.id} />
      </div>

      {/* Main area: empty state on desktop */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="text-muted-foreground flex flex-col items-center gap-3">
          <MessageSquare className="h-12 w-12" />
          <p className="text-sm">{t("selectConversation")}</p>
        </div>
      </div>
    </div>
  );
}
