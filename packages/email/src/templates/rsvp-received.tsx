import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "../components/base-layout";
import type { BaseEmailProps } from "../types";

type RsvpReceivedProps = BaseEmailProps & {
  name: string;
  status: string;
  eventUrl: string;
};

export function RsvpReceived({ name, status, locale, baseUrl, messages }: RsvpReceivedProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.rsvpReceived" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { name, status })}</Text>
    </BaseLayout>
  );
}

RsvpReceived.PreviewProps = {
  name: "Jan de Vries",
  status: "attending",
  eventUrl: "http://localhost:3000/my-rooms",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: "OpenHospi — Free student housing platform for the Netherlands",
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      rsvpReceived: {
        heading: "New RSVP",
        body: "{name} has responded with: {status}.",
      },
    },
  },
};

export default RsvpReceived;

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
