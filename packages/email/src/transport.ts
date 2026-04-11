import { createTransport, type Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const { GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_HOST } = process.env;

  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    // Production: Google Workspace SMTP Relay (no From: rewriting)
    _transporter = createTransport({
      service: "GmailWorkspace",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  } else if (SMTP_HOST) {
    // Local dev: generic SMTP (Inbucket, Mailpit, etc.)
    _transporter = createTransport({
      host: SMTP_HOST,
      port: 2500,
      secure: false,
    });
  } else {
    throw new Error(
      "No email transport configured. Set GMAIL_USER + GMAIL_APP_PASSWORD for Google Workspace, or SMTP_HOST for local SMTP.",
    );
  }

  return _transporter;
}
