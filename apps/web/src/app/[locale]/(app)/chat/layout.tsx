import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getConversations } from "@/lib/chat";

import { ConversationList } from "./conversation-list";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ChatLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const conversations = await getConversations(user.id);
  const t = await getTranslations("app.chat");

  return (
    <Main className="flex-row gap-0 p-0">
      {/* Left panel: conversation list — always visible on md+ */}
      <aside className="hidden w-80 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="font-semibold">{t("title")}</h2>
        </div>
        <ScrollArea className="flex-1">
          <ConversationList conversations={conversations} currentUserId={user.id} />
        </ScrollArea>
      </aside>
      {/* Right panel: children (placeholder or conversation thread) */}
      <div className="flex flex-1 flex-col">{children}</div>
    </Main>
  );
}
