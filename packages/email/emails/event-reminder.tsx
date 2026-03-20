import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import type { BaseEmailProps } from "./_types";

type EventReminderProps = BaseEmailProps & {
  eventTitle: string;
  time: string;
  eventUrl: string;
};

export function EventReminder({
  eventTitle,
  time,
  eventUrl,
  locale,
  baseUrl,
  messages,
}: EventReminderProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.eventReminder" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
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
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: "OpenHospi — Free student housing platform for the Netherlands",
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      eventReminder: {
        heading: "Event reminder",
        body: 'Just a reminder that "{eventTitle}" starts at {time}.',
        cta: "View event",
      },
    },
  },
};

export default EventReminder;

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const text = {
  fontSize: "16px",
  color: "#333",
  lineHeight: "24px",
  margin: "0 0 8px",
};
