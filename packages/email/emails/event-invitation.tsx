import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type EventInvitationProps = BaseEmailProps & {
  eventTitle: string;
  roomTitle: string;
  eventUrl: string;
};

export async function EventInvitation({
  eventTitle,
  roomTitle,
  eventUrl,
  locale,
  baseUrl,
}: EventInvitationProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "eventInvitation" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { eventTitle, roomTitle })}</Text>
      <CtaButton href={eventUrl}>{t("cta")}</CtaButton>
    </BaseLayout>
  );
}

EventInvitation.PreviewProps = {
  eventTitle: "Movie Night",
  roomTitle: "Cosy room in Amsterdam",
  eventUrl: "http://localhost:3000/applications",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default EventInvitation;
