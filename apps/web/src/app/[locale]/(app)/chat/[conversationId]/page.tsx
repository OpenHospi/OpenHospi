import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getConversationDetail, getMessages } from "@/lib/queries/chat";

import { ChatView } from "./chat-view";

type Props = {
  params: Promise<{ locale: string; conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
  const { locale, conversationId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await requireSession();
  const detail = await getConversationDetail(session.user.id, conversationId);

  if (!detail) notFound();

  const { messages, nextCursor } = await getMessages(session.user.id, conversationId);

  return (
    <ChatView
      conversation={detail}
      initialMessages={messages}
      initialCursor={nextCursor}
      currentUserId={session.user.id}
    />
  );
}
