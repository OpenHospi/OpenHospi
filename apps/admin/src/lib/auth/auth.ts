import { sso } from "@better-auth/sso";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";

import { GOOGLE_SAML_IDP_CERT } from "./google-saml-idp-cert";

const ALLOWED_EMAIL_DOMAIN = "openhospi.nl";
const OWNER_GROUP = "bestuur@openhospi.nl";
const ADMIN_GROUP = "admin-panel@openhospi.nl";

const GOOGLE_SAML_SSO_URL = "https://accounts.google.com/o/saml2/idp?idpid=C02mwjbtz";
const GOOGLE_SAML_ENTITY_ID = "https://accounts.google.com/o/saml2?idpid=C02mwjbtz";
const ADMIN_ORG_SLUG = "openhospi";
const SSO_PROVIDER_ID = "google-workspace";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

function resolveOrgRole(groups: string[]): "owner" | "admin" | "member" {
  if (groups.includes(OWNER_GROUP)) return "owner";
  if (groups.includes(ADMIN_GROUP)) return "admin";
  return "member";
}

function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (IS_PRODUCTION && !IS_BUILD_PHASE) {
    throw new Error(
      "BETTER_AUTH_SECRET is required in production. Generate one with: openssl rand -base64 32",
    );
  }
  return "build-placeholder-secret-not-for-production-use";
}

/**
 * Ensures the OpenHospi organization and Google Workspace SAML SSO provider
 * exist in the database. Idempotent: safe to run on every cold start.
 * Refreshes the stored samlConfig when BETTER_AUTH_URL changes so ACS /
 * audience / entityID stay in sync with the deployed host.
 * Wrapped in a single transaction so a partial failure cannot leave the DB
 * with an org but no provider (or vice versa).
 */
async function ensureAdminSetup() {
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) return;

  const expectedCallbackUrl = `${baseUrl}/api/auth/sso/saml2/sp/acs/${SSO_PROVIDER_ID}`;
  const samlConfig = JSON.stringify({
    issuer: GOOGLE_SAML_ENTITY_ID,
    entryPoint: GOOGLE_SAML_SSO_URL,
    cert: GOOGLE_SAML_IDP_CERT,
    callbackUrl: expectedCallbackUrl,
    audience: baseUrl,
    wantAssertionsSigned: true,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    idpMetadata: { entityID: GOOGLE_SAML_ENTITY_ID },
    spMetadata: { entityID: baseUrl },
    mapping: {
      id: "nameID",
      email: "email",
      firstName: "firstName",
      lastName: "lastName",
    },
  });

  await db.transaction(async (tx) => {
    const [existingOrg] = await tx
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.slug, ADMIN_ORG_SLUG))
      .limit(1);

    let orgId: string;
    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      orgId = crypto.randomUUID();
      await tx
        .insert(schema.organization)
        .values({ id: orgId, name: "OpenHospi", slug: ADMIN_ORG_SLUG })
        .onConflictDoNothing({ target: schema.organization.slug });
    }

    const [existingProvider] = await tx
      .select({ id: schema.ssoProvider.id, samlConfig: schema.ssoProvider.samlConfig })
      .from(schema.ssoProvider)
      .where(eq(schema.ssoProvider.providerId, SSO_PROVIDER_ID))
      .limit(1);

    if (existingProvider) {
      const stored = (() => {
        try {
          return JSON.parse(existingProvider.samlConfig ?? "{}") as {
            callbackUrl?: string;
            issuer?: string;
          };
        } catch {
          return {};
        }
      })();
      if (stored.callbackUrl !== expectedCallbackUrl || stored.issuer !== GOOGLE_SAML_ENTITY_ID) {
        await tx
          .update(schema.ssoProvider)
          .set({ samlConfig, issuer: GOOGLE_SAML_ENTITY_ID, domain: ALLOWED_EMAIL_DOMAIN })
          .where(eq(schema.ssoProvider.id, existingProvider.id));
      }
      return;
    }

    await tx
      .insert(schema.ssoProvider)
      .values({
        id: crypto.randomUUID(),
        providerId: SSO_PROVIDER_ID,
        issuer: GOOGLE_SAML_ENTITY_ID,
        domain: ALLOWED_EMAIL_DOMAIN,
        samlConfig,
        organizationId: orgId,
        userId: orgId,
      })
      .onConflictDoNothing({ target: schema.ssoProvider.providerId });
  });
}

function createAuth() {
  return betterAuth({
    secret: resolveAuthSecret(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { ...schema },
    }),
    advanced: {
      trustedProxyHeaders: true,
      useSecureCookies: IS_PRODUCTION,
      cookiePrefix: "openhospi-admin",
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: IS_PRODUCTION,
      },
      database: {
        generateId: "uuid",
      },
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
      freshAge: 60 * 10,
    },
    account: {
      accountLinking: {
        enabled: true,
        // Google Workspace SAML is the only sign-in path for the admin panel.
        // The IdP owns @openhospi.nl and signs every assertion, so emails from
        // this provider are authoritative — link to existing users by email.
        trustedProviders: [SSO_PROVIDER_ID],
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/sso": { window: 60, max: 5 },
        "/sso/saml2/sp/acs/:providerId": { window: 60, max: 10 },
      },
    },
    trustedOrigins: [
      "https://admin.openhospi.nl",
      "https://accounts.google.com",
      ...(process.env.NODE_ENV === "development"
        ? ["https://dev-admin.openhospi.nl:3001", "http://localhost:3001"]
        : []),
    ],
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const email = user.email?.toLowerCase() ?? "";
            if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
              throw new APIError("FORBIDDEN", {
                message: `Only ${ALLOWED_EMAIL_DOMAIN} accounts can access the admin panel.`,
              });
            }
            return { data: user };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            // On first SSO login the member row doesn't exist yet (SSO plugin
            // creates the session BEFORE assignOrganizationFromProvider runs).
            // Derive activeOrganizationId from the SSO provider instead, which
            // is guaranteed to exist at this point. Fall back to an existing
            // membership lookup for non-SSO sessions.
            const [user] = await db
              .select({ email: schema.user.email })
              .from(schema.user)
              .where(eq(schema.user.id, session.userId))
              .limit(1);
            const domain = user?.email?.split("@")[1]?.toLowerCase();
            if (domain) {
              const [provider] = await db
                .select({ organizationId: schema.ssoProvider.organizationId })
                .from(schema.ssoProvider)
                .where(eq(schema.ssoProvider.domain, domain))
                .limit(1);
              if (provider?.organizationId) {
                return {
                  data: { ...session, activeOrganizationId: provider.organizationId },
                };
              }
            }
            const [membership] = await db
              .select({ organizationId: schema.member.organizationId })
              .from(schema.member)
              .where(eq(schema.member.userId, session.userId))
              .limit(1);
            if (membership) {
              return {
                data: { ...session, activeOrganizationId: membership.organizationId },
              };
            }
            return { data: session };
          },
        },
      },
    },
    plugins: [
      sso({
        provisionUserOnEveryLogin: true,
        // Sync user.role (admin plugin) + member.role (organization plugin) on
        // every SSO login so Google group changes propagate on next sign-in.
        // Member row creation is handled by SSO's assignOrganizationFromProvider
        // (enabled via organizationProvisioning below) — we only update roles.
        provisionUser: async ({ user, userInfo }) => {
          const groups = (userInfo?.attributes?.groups as string[]) ?? [];
          const orgRole = resolveOrgRole(groups);
          const userRole = orgRole === "member" ? null : "admin";

          if (user.role !== userRole) {
            await db.update(schema.user).set({ role: userRole }).where(eq(schema.user.id, user.id));
          }

          const domain = user.email?.split("@")[1]?.toLowerCase();
          if (!domain) return;
          const [provider] = await db
            .select({ organizationId: schema.ssoProvider.organizationId })
            .from(schema.ssoProvider)
            .where(eq(schema.ssoProvider.domain, domain))
            .limit(1);
          if (!provider?.organizationId) return;

          await db
            .update(schema.member)
            .set({ role: orgRole })
            .where(
              and(
                eq(schema.member.userId, user.id),
                eq(schema.member.organizationId, provider.organizationId),
              ),
            );
        },
        organizationProvisioning: {
          disabled: false,
          defaultRole: "member",
          // SSO plugin types narrow getRole to "admin" | "member", but the
          // runtime accepts any string the organization plugin knows about —
          // "owner" is valid and mapped to the org role column directly.
          getRole: async ({ userInfo }) => {
            const groups = (userInfo?.attributes?.groups as string[]) ?? [];
            return resolveOrgRole(groups) as "admin" | "member";
          },
        },
        saml: {
          requireTimestamps: true,
          requireSignedAssertions: true,
          wantAuthnResponseSigned: true,
          allowIdpInitiated: true,
          algorithms: {
            onDeprecated: "reject",
          },
        },
      }),
      organization({
        allowUserToCreateOrganization: false,
      }),
      admin(),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;
let _setupPromise: Promise<void> | null = null;

function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }
  if (!_setupPromise) {
    _setupPromise = ensureAdminSetup().catch((err) => {
      console.error("Admin SSO setup failed:", err);
      _setupPromise = null;
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
