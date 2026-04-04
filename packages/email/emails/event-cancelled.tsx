import { EMAIL_FOOTER } from "@openhospi/shared/constants";
import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import type { BaseEmailProps } from "./_types";

type EventCancelledProps = BaseEmailProps & {
  eventTitle: string;
};

export function EventCancelled({ eventTitle, locale, baseUrl, messages }: EventCancelledProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.eventCancelled" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { eventTitle })}</Text>
    </BaseLayout>
  );
}

EventCancelled.PreviewProps = {
  eventTitle: "Movie Night",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: EMAIL_FOOTER,
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      eventCancelled: {
        heading: "Event cancelled",
        body: 'The hospi event "{eventTitle}" has been cancelled by the organiser.',
      },
    },
  },
};

export default EventCancelled;

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
