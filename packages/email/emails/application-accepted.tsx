import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type ApplicationAcceptedProps = BaseEmailProps & {
  roomTitle: string;
  roomUrl: string;
};

export async function ApplicationAccepted({
  roomTitle,
  roomUrl,
  locale,
  baseUrl,
}: ApplicationAcceptedProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "applicationAccepted" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { roomTitle })}</Text>
      <CtaButton href={roomUrl}>{t("cta")}</CtaButton>
    </BaseLayout>
  );
}

ApplicationAccepted.PreviewProps = {
  roomTitle: "Cosy room in Amsterdam",
  roomUrl: "http://localhost:3000/rooms/123",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default ApplicationAccepted;
