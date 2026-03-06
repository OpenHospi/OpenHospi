import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "../components/base-layout";
import type { BaseEmailProps } from "../types";

type UserBannedProps = BaseEmailProps & {
  reason: string;
};

export function UserBanned({ reason, locale, baseUrl, messages }: UserBannedProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.userBanned" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { reason })}</Text>
      <Text style={muted}>{t("contact")}</Text>
    </BaseLayout>
  );
}

UserBanned.PreviewProps = {
  reason: "Repeated harassment of other users",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: "OpenHospi — Free student housing platform for the Netherlands",
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      userBanned: {
        heading: "Account suspended",
        body: "Your account has been suspended for the following reason: {reason}.",
        contact: "If you believe this is a mistake, please contact us at support@openhospi.nl.",
      },
    },
  },
};

export default UserBanned;

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

const muted = {
  fontSize: "14px",
  color: "#666",
  lineHeight: "20px",
  margin: "16px 0 0",
};
