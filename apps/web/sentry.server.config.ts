// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // eslint-disable-next-line no-secrets/no-secrets -- Sentry DSNs are public
  dsn: "https://45421526d1e19063ca7dd1030b065dff@o4511172188438528.ingest.de.sentry.io/4511179164352592",

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
