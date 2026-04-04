import { EMAIL_FOOTER } from "@openhospi/shared/constants";
import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import type { BaseEmailProps } from "./_types";

type ApplicationNotChosenProps = BaseEmailProps & {
  roomTitle: string;
};

export function ApplicationNotChosen({
  roomTitle,
  locale,
  baseUrl,
  messages,
}: ApplicationNotChosenProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.applicationNotChosen" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { roomTitle })}</Text>
    </BaseLayout>
  );
}

ApplicationNotChosen.PreviewProps = {
  roomTitle: "Cosy room in Amsterdam",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: EMAIL_FOOTER,
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      applicationNotChosen: {
        heading: "Application update",
        body: 'Unfortunately, the room "{roomTitle}" has been filled. Don\'t give up — there are plenty of other rooms available!',
      },
    },
  },
};

export default ApplicationNotChosen;

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
