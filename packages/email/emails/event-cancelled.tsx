import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type EventCancelledProps = BaseEmailProps & {
  eventTitle: string;
};

export async function EventCancelled({ eventTitle, locale, baseUrl }: EventCancelledProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "eventCancelled" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { eventTitle })}</Text>
    </BaseLayout>
  );
}

EventCancelled.PreviewProps = {
  eventTitle: "Movie Night",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default EventCancelled;
