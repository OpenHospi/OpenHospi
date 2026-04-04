import { EMAIL_FOOTER } from "@openhospi/shared/constants";
import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import type { BaseEmailProps } from "./_types";

type ApplicationAcceptedProps = BaseEmailProps & {
  roomTitle: string;
  roomUrl: string;
};

export function ApplicationAccepted({
  roomTitle,
  roomUrl,
  locale,
  baseUrl,
  messages,
}: ApplicationAcceptedProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.applicationAccepted" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { roomTitle })}</Text>
      <CtaButton href={roomUrl}>{t("cta")}</CtaButton>
    </BaseLayout>
  );
}

ApplicationAccepted.PreviewProps = {
  roomTitle: "Cosy room in Amsterdam",
  roomUrl: "http://localhost:3000/rooms/123",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: EMAIL_FOOTER,
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      applicationAccepted: {
        heading: "Application accepted!",
        body: 'Great news — you\'ve been chosen for the room "{roomTitle}". The room owner will be in touch with next steps.',
        cta: "View room",
      },
    },
  },
};

export default ApplicationAccepted;

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
