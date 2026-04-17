import { sso } from "@better-auth/sso";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { sql } from "drizzle-orm";

const GOOGLE_SAML_SSO_URL = "https://accounts.google.com/o/saml2/idp?idpid=C02mwjbtz";
const GOOGLE_SAML_ENTITY_ID = "https://accounts.google.com/o/saml2?idpid=C02mwjbtz";
const ADMIN_ORG_SLUG = "openhospi";
const SSO_PROVIDER_ID = "google-workspace";

/**
 * Ensures the OpenHospi organization and Google Workspace SAML SSO provider
 * exist in the database. Runs once on first request (idempotent).
 */
async function ensureAdminSetup() {
  const baseUrl = process.env.BETTER_AUTH_URL;
  const cert = process.env.GOOGLE_SAML_CERT;
  if (!baseUrl || !cert) return;

  // Check if org exists
  const [existingOrg] = await db.execute<{ id: string }>(
    sql`SELECT id FROM "organization" WHERE slug = ${ADMIN_ORG_SLUG} LIMIT 1`,
  );

  let orgId: string;

  if (!existingOrg) {
    const id = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO "organization" (id, name, slug, created_at)
          VALUES (${id}, 'OpenHospi', ${ADMIN_ORG_SLUG}, NOW())
          ON CONFLICT (slug) DO NOTHING`,
    );
    orgId = id;
  } else {
    orgId = existingOrg.id;
  }

  // Check if SSO provider exists
  const [existingProvider] = await db.execute<{ id: string }>(
    sql`SELECT id FROM "ssoProvider" WHERE provider_id = ${SSO_PROVIDER_ID} LIMIT 1`,
  );

  if (!existingProvider) {
    const samlConfig = JSON.stringify({
      entryPoint: GOOGLE_SAML_SSO_URL,
      cert,
      callbackUrl: `${baseUrl}/api/auth/sso/saml2/sp/acs/${SSO_PROVIDER_ID}`,
      audience: baseUrl,
      wantAssertionsSigned: true,
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
      identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      spMetadata: { entityID: baseUrl },
      mapping: {
        id: "nameID",
        email: "email",
        name: "displayName",
        firstName: "firstName",
        lastName: "lastName",
      },
    });

    await db.execute(
      sql`INSERT INTO "ssoProvider" (id, provider_id, issuer, domain, saml_config, organization_id, user_id)
          VALUES (${crypto.randomUUID()}, ${SSO_PROVIDER_ID}, ${GOOGLE_SAML_ENTITY_ID}, 'openhospi.nl', ${samlConfig}, ${orgId}, ${orgId})
          ON CONFLICT (provider_id) DO NOTHING`,
    );
  }
}

function createAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? "build-placeholder-secret-not-for-production-use",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { ...schema },
    }),
    advanced: {
      trustedProxyHeaders: true,
      database: {
        generateId: "uuid",
      },
    },
    trustedOrigins: [
      "https://*.openhospi.nl",
      "https://accounts.google.com",
      ...(process.env.NODE_ENV === "development"
        ? ["https://dev-admin.openhospi.nl:3001", "http://localhost:3000", "http://localhost:3001"]
        : []),
    ],
    plugins: [
      sso({
        provisionUserOnEveryLogin: true,
        organizationProvisioning: {
          disabled: false,
          defaultRole: "member",
          // Better Auth types only allow "member" | "admin" but "owner" works at runtime (#7719)
          getRole: async ({ user, userInfo }) => {
            const email = user.email ?? userInfo?.email;
            if (!email?.endsWith("@openhospi.nl")) {
              throw new Error("Only openhospi.nl accounts are allowed");
            }

            const groups = (userInfo?.attributes?.groups as string[]) ?? [];

            if (groups.includes("bestuur@openhospi.nl")) {
              return "owner" as "admin";
            }
            if (groups.includes("admin-panel@openhospi.nl")) {
              return "admin";
            }
            return "member";
          },
        },
        saml: {
          requireTimestamps: true,
          algorithms: {
            onDeprecated: "reject",
          },
        },
      }),
      organization(),
      admin(),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;
let _setupDone = false;

function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }
  if (!_setupDone) {
    _setupDone = true;
    ensureAdminSetup().catch((err) => {
      console.error("Admin SSO setup failed:", err);
      _setupDone = false;
    });
  }
  return _auth;
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop: string | symbol) {
    return Reflect.get(getAuth(), prop);
  },
  has(_, prop: string | symbol) {
    return Reflect.has(getAuth(), prop);
  },
});
