import type { Locale } from "@openhospi/i18n";

import { getTransporter } from "./transport";

import type { EmailTemplateName, TemplatePropsMap } from "./index";
import { renderEmail } from "./index";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  return getTransporter().sendMail({
    from: '"OpenHospi" <noreply@openhospi.nl>',
    to,
    subject,
    text,
    html,
  });
}

export async function sendTemplatedEmail<T extends EmailTemplateName>(
  to: string,
  template: T,
  props: TemplatePropsMap[T],
  locale: Locale,
) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "https://openhospi.nl";
  const { html, text, subject } = await renderEmail(template, props, locale, baseUrl);
  return sendEmail({ to, subject, text, html });
}
