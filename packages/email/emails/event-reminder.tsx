import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type EventReminderProps = BaseEmailProps & {
  eventTitle: string;
  time: string;
  eventUrl: string;
};

export async function EventReminder({
  eventTitle,
  time,
  eventUrl,
  locale,
  baseUrl,
}: EventReminderProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "eventReminder" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { eventTitle, time })}</Text>
      <CtaButton href={eventUrl}>{t("cta")}</CtaButton>
    </BaseLayout>
  );
}

EventReminder.PreviewProps = {
  eventTitle: "Movie Night",
  time: "19:00",
  eventUrl: "http://localhost:3000/applications",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default EventReminder;
