import { EMAIL_FOOTER } from "@openhospi/shared/constants";
import { Text } from "@react-email/components";
import { createTranslator } from "next-intl";

import { BaseLayout } from "./_components/base-layout";
import type { BaseEmailProps } from "./_types";

type ListingRemovedProps = BaseEmailProps & {
  reason: string;
};

export function ListingRemoved({ reason, locale, baseUrl, messages }: ListingRemovedProps) {
  const t = createTranslator({ locale, messages, namespace: "emails.listingRemoved" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl} messages={messages}>
      <Text style={heading}>{t("heading")}</Text>
      <Text style={text}>{t("body", { reason })}</Text>
      <Text style={muted}>{t("contact")}</Text>
    </BaseLayout>
  );
}

ListingRemoved.PreviewProps = {
  reason: "Listing contains misleading information",
  baseUrl: "http://localhost:3000",
  locale: "en",
  messages: {
    emails: {
      common: {
        footer: EMAIL_FOOTER,
        doNotReply: "This is an automated message. Please do not reply to this email.",
      },
      listingRemoved: {
        heading: "Listing removed",
        body: "Your listing has been removed for the following reason: {reason}.",
        contact: "If you believe this is a mistake, please contact us at support@openhospi.nl.",
      },
    },
  },
};

export default ListingRemoved;

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
