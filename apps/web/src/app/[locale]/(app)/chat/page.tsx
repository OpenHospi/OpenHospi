import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireSession } from "@/lib/auth-server";
import { getConversations } from "@/lib/chat";

import { ConversationList } from "./conversation-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.chat" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{(await getTranslations("app.chat"))("title")}</h1>
      <ConversationList conversations={conversations} currentUserId={user.id} />
    </div>
  );
}
