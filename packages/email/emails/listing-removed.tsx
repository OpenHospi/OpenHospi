import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { heading, muted, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type ListingRemovedProps = BaseEmailProps & {
  reason: string;
};

export async function ListingRemoved({ reason, locale, baseUrl }: ListingRemovedProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "listingRemoved" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { reason })}</Text>
      <Text style={muted}>{t("contact")}</Text>
    </BaseLayout>
  );
}

ListingRemoved.PreviewProps = {
  reason: "Listing contains misleading information",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default ListingRemoved;
