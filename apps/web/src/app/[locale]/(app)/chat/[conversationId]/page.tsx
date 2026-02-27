import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireSession } from "@/lib/auth-server";
import { getConversationMembers, getMessages } from "@/lib/chat";

import { ChatView } from "./chat-view";

type Props = {
  params: Promise<{ locale: string; conversationId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.chat" });
  return { title: t("conversation") };
}

export default async function ConversationPage({ params }: Props) {
  const { locale, conversationId } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const [initialMessages, members] = await Promise.all([
    getMessages(user.id, conversationId),
    getConversationMembers(user.id, conversationId),
  ]);

  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user.id}
      initialMessages={initialMessages}
      members={members}
    />
  );
}
