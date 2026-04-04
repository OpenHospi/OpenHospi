import { EMAIL_FOOTER } from "@openhospi/shared/constants";
import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import { CtaButton } from "./_components/cta-button";
import type { BaseEmailProps } from "./_types";

type EventInvitationProps = BaseEmailProps & {
  eventTitle: string;
  roomTitle: string;
  eventUrl: string;
};

export function EventInvitation({
  eventTitle,
  roomTitle,
  eventUrl,
  locale,
  baseUrl,
  messages,
}: EventInvitationProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.eventInvitation" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
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
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: EMAIL_FOOTER,
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      eventInvitation: {
        heading: "You're invited!",
        body: 'You\'ve been invited to the hospi event "{eventTitle}" for the room "{roomTitle}".',
        cta: "View invitation",
      },
    },
  },
};

export default EventInvitation;

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
