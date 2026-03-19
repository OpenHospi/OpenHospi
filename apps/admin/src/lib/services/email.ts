import type { EmailTemplateName, TemplatePropsMap } from "@openhospi/email";
import { renderEmail } from "@openhospi/email";
import type { Locale } from "@openhospi/i18n";
import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

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
  return transporter.sendMail({
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
