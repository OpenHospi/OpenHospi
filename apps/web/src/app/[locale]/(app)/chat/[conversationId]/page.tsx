import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SetBreadcrumb } from "@/components/app/breadcrumb-store";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getConversationMembers, getMessages } from "@/lib/chat";

import { getBlockedUsers } from "../block-actions";

import { ChatView } from "./chat-view";

type Props = {
  params: Promise<{ locale: Locale; conversationId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.chat" });
  return { title: t("conversation") };
}

export default async function ConversationPage({ params }: Props) {
  const { locale, conversationId } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const [initialMessages, members, blockedUserIds] = await Promise.all([
    getMessages(user.id, conversationId),
    getConversationMembers(user.id, conversationId),
    getBlockedUsers(),
  ]);

  const chatLabel =
    members
      .filter((m) => m.userId !== user.id)
      .map((m) => `${m.firstName} ${m.lastName}`)
      .join(", ") || "Chat";

  return (
    <>
      <SetBreadcrumb uuid={conversationId} label={chatLabel} />
      <ChatView
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={initialMessages}
        members={members}
        blockedUserIds={blockedUserIds}
      />
    </>
  );
}
