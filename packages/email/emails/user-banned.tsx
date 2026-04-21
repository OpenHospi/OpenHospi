import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { heading, muted, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type UserBannedProps = BaseEmailProps & {
  reason: string;
};

export async function UserBanned({ reason, locale, baseUrl }: UserBannedProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "userBanned" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { reason })}</Text>
      <Text style={muted}>{t("contact")}</Text>
    </BaseLayout>
  );
}

UserBanned.PreviewProps = {
  reason: "Repeated harassment of other users",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default UserBanned;
