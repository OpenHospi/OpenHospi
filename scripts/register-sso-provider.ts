/**
 * One-time script to register the SURFconext SSO provider with Better Auth.
 *
 * Usage:
 *   npx tsx scripts/register-sso-provider.ts
 *
 * Required environment variables:
 *   SUPABASE_DB_URL          — PostgreSQL connection string
 *   BETTER_AUTH_URL           — e.g. http://localhost:3000 or https://openhospi.nl
 *   SURFCONEXT_CLIENT_ID      — OIDC client ID from SURFconext SP Dashboard
 *   SURFCONEXT_CLIENT_SECRET  — OIDC client secret
 *   SURFCONEXT_ENV            — "test" or "production" (defaults to "test")
 */

import { getSurfconextConfig } from "@openhospi/surfconext";
import { auth } from "../apps/web/src/lib/auth";

async function main() {
  const clientId = process.env.SURFCONEXT_CLIENT_ID;
  const clientSecret = process.env.SURFCONEXT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing SURFCONEXT_CLIENT_ID or SURFCONEXT_CLIENT_SECRET");
    process.exit(1);
  }

  const env = (process.env.SURFCONEXT_ENV as "test" | "production") || "test";
  const config = getSurfconextConfig(env);

  console.log(`Registering SURFconext SSO provider (${env})...`);
  console.log(`  Issuer: ${config.issuer}`);

  const result = await auth.api.registerSSOProvider({
    body: {
      providerId: "surfconext",
      issuer: config.issuer,
      domain: "surfconext.nl",
      clientId,
      clientSecret,
      scopes: config.scopes,
    },
  });

  console.log("Provider registered successfully:", result);
}

main().catch((error) => {
  console.error("Failed to register SSO provider:", error);
  process.exit(1);
});
