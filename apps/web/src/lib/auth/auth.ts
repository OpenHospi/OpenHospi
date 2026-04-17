import { createHash } from "node:crypto";

import { expo } from "@better-auth/expo";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { sendTemplatedEmail } from "@openhospi/email/send";
import { DEFAULT_LOCALE, type Locale } from "@openhospi/i18n";
import {
  APPLE_BUNDLE_ID,
  GOOGLE_WEB_CLIENT_ID,
  REVIEWER_INSTITUTION_DOMAIN,
} from "@openhospi/shared/constants";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, bearer, genericOAuth, jwt, multiSession } from "better-auth/plugins";
import { and, eq, gt } from "drizzle-orm";

function deriveOnboardingEmailCode(token: string): string {
  const hash = createHash("sha256").update(token).digest("hex");
  const numeric = Number.parseInt(hash.slice(0, 8), 16) % 1_000_000;
  return numeric.toString().padStart(6, "0");
}

function onboardingCodeIdentifier(userId: string): string {
  return `onboarding-email-code:${userId}`;
}

function onboardingCodeExpiresAt(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}

function parseVerificationToken(url: string, token?: string): string | null {
  if (token) return token;
  try {
    return new URL(url).searchParams.get("token");
  } catch {
    return null;
  }
}

/**
 * Extracts the `idp_hint` claim from the newly-minted user's InAcademia ID
 * token. Returns an empty string on any failure (missing account row,
 * malformed JWT, missing claim) — the caller still inserts a profile, and
 * institutionDomain can be filled in later during onboarding.
 */
async function extractInacademiaEntityId(userId: string): Promise<string> {
  const [account] = await db
    .select({ idToken: schema.account.idToken })
    .from(schema.account)
    .where(eq(schema.account.userId, userId));

  if (!account?.idToken) {
    console.warn("[auth] No ID token found for newly created user", { userId });
    return "";
  }

  try {
    const parts = account.idToken.split(".");
    if (parts.length !== 3 || !parts[1]) {
      throw new Error(`malformed JWT (${parts.length} parts)`);
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const entityId = (payload.idp_hint as string) ?? "";
    if (!entityId) {
      console.warn("[auth] InAcademia ID token missing idp_hint claim", { userId });
    }
    return entityId;
  } catch (err) {
    console.error("[auth] Failed to decode InAcademia ID token:", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

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

function resolveInacademiaCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.INACADEMIA_CLIENT_ID;
  const clientSecret = process.env.INACADEMIA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    if (IS_PRODUCTION && !IS_BUILD_PHASE) {
      throw new Error(
        "INACADEMIA_CLIENT_ID and INACADEMIA_CLIENT_SECRET are required in production.",
      );
    }
    return {
      clientId: clientId ?? "dev-placeholder",
      clientSecret: clientSecret ?? "dev-placeholder",
    };
  }
  return { clientId, clientSecret };
}

function createAuth() {
  const inacademia = resolveInacademiaCredentials();
  return betterAuth({
    secret: resolveAuthSecret(),
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
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // Extend session if last refresh was > 1 day ago
    },
    account: {
      accountLinking: {
        enabled: true,
        // Apple and Google are first-party IdPs that sign emails. Safe to
        // auto-link a returning user's Apple login to an existing Google
        // account with the same email (or vice versa) — relevant for app
        // store reviewers who may switch platforms.
        trustedProviders: ["apple", "google"],
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/oauth2/callback/:providerId": { window: 60, max: 10 },
        "/verify-email": { window: 60, max: 10 },
        "/forget-password": { window: 60, max: 3 },
      },
    },
    trustedOrigins: [
      "https://openhospi.nl",
      "https://www.openhospi.nl",
      "https://app.openhospi.nl",
      "https://op.srv.inacademia.org",
      "https://appleid.apple.com",
      "openhospi://",
      ...(process.env.NODE_ENV === "development"
        ? [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://dev-admin.openhospi.nl:3001",
            "exp+openhospi://",
            "exp://",
            "exp://**",
            "exp://192.168.*.*:*/**",
          ]
        : []),
    ],
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        const verificationToken = parseVerificationToken(url, token);
        if (!verificationToken) return;

        const code = deriveOnboardingEmailCode(verificationToken);
        const identifier = onboardingCodeIdentifier(user.id);

        await db
          .delete(schema.verification)
          .where(
            and(
              eq(schema.verification.identifier, identifier),
              gt(schema.verification.expiresAt, new Date()),
            ),
          );

        await db.insert(schema.verification).values({
          identifier,
          value: JSON.stringify({ token: verificationToken, code, email: user.email }),
          expiresAt: onboardingCodeExpiresAt(),
        });

        let locale: Locale = DEFAULT_LOCALE;
        try {
          const [profile] = await db
            .select({ preferredLocale: schema.profiles.preferredLocale })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, user.id));
          if (profile?.preferredLocale === "en" || profile?.preferredLocale === "de") {
            locale = profile.preferredLocale;
          }
        } catch {
          // Profile may not exist yet during onboarding
        }

        sendTemplatedEmail(user.email, "verificationCode", { code }, locale).catch((err) => {
          console.error("[email] Failed to send verification code:", err.message);
        });
      },
      autoSignInAfterVerification: true,
      expiresIn: 3600,
    },
    socialProviders: {
      apple: {
        clientId: APPLE_BUNDLE_ID,
        appBundleIdentifier: APPLE_BUNDLE_ID,
      },
      google: {
        clientId: GOOGLE_WEB_CLIENT_ID,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // Privacy: store a synthetic internal email in auth.user. The real
            // email from InAcademia is never released (profile.sub@inacademia.…
            // is already synthetic via mapProfileToUser); Apple/Google reviewer
            // accounts are throwaway so we rewrite those too. In development
            // we keep the real email for local debugging.
            // emailVerified is intentionally NOT touched — let each provider
            // set it: Apple/Google = true, InAcademia = false (per its
            // mapProfileToUser), email signup = false (verified via code).
            const keepRealEmail = process.env.NODE_ENV === "development";
            return {
              data: {
                ...user,
                email: keepRealEmail ? user.email : `${user.id}@id.openhospi.nl`,
              },
            };
          },
          after: async (user) => {
            const [existing] = await db
              .select({ id: schema.profiles.id })
              .from(schema.profiles)
              .where(eq(schema.profiles.id, user.id));
            if (existing) return;

            if (process.env.NODE_ENV === "development") {
              const nameParts = (user.name ?? "Dev User").split(" ");
              await db
                .insert(schema.profiles)
                .values({
                  id: user.id,
                  firstName: nameParts[0] || "Dev",
                  lastName: nameParts.slice(1).join(" ") || "User",
                  email: user.email,
                  institutionDomain:
                    "https://sts.windows.net/a3b39014-7adc-48fa-a114-37c2434dbd69/",
                })
                .onConflictDoNothing();
              return;
            }

            // Apple/Google reviewer accounts: auto-complete onboarding
            const [accountRecord] = await db
              .select({ providerId: schema.account.providerId })
              .from(schema.account)
              .where(eq(schema.account.userId, user.id));

            if (accountRecord?.providerId === "apple" || accountRecord?.providerId === "google") {
              const nameParts = (user.name ?? "App Reviewer").split(" ");

              await db
                .insert(schema.profiles)
                .values({
                  id: user.id,
                  firstName: nameParts[0] || "App",
                  lastName: nameParts.slice(1).join(" ") || "Reviewer",
                  email: user.email,
                  institutionDomain: REVIEWER_INSTITUTION_DOMAIN,
                  gender: "male",
                  birthDate: "2001-01-15",
                  studyProgram: "Computer Science",
                  preferredCity: "Amsterdam",
                  bio: "App store reviewer account.",
                  lifestyleTags: ["sociable", "cooking", "sports"],
                  languages: ["nl", "en"],
                  preferredLocale: "en",
                })
                .onConflictDoNothing();

              await db
                .insert(schema.profilePhotos)
                .values({
                  userId: user.id,
                  url: "profile-photos/reviewer-placeholder.jpg",
                  slot: 0,
                })
                .onConflictDoNothing();

              await db
                .insert(schema.privateKeyBackups)
                .values({
                  userId: user.id,
                  encryptedData: "reviewer-placeholder",
                  iv: "reviewer-placeholder",
                  salt: "reviewer-placeholder",
                })
                .onConflictDoNothing();

              await db
                .insert(schema.devices)
                .values({
                  userId: user.id,
                  registrationId: 1,
                  identityKeyPublic: "reviewer-placeholder",
                  signingKeyPublic: "reviewer-placeholder",
                  platform: accountRecord.providerId === "apple" ? "ios" : "android",
                })
                .onConflictDoNothing();

              return;
            }

            const entityId = await extractInacademiaEntityId(user.id);
            await db
              .insert(schema.profiles)
              .values({
                id: user.id,
                firstName: "",
                lastName: "",
                email: user.email,
                institutionDomain: entityId,
              })
              .onConflictDoNothing();
          },
        },
      },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "inacademia",
            clientId: inacademia.clientId,
            clientSecret: inacademia.clientSecret,
            discoveryUrl: "https://op.srv.inacademia.org/.well-known/openid-configuration",
            scopes: ["openid", "student", "persistent"],
            pkce: true,
            authentication: "basic",
            authorizationUrlParams: {
              claims: JSON.stringify({
                id_token: {
                  domain: null,
                  institution: null,
                  idp_hint: null,
                  reuse_detection: null,
                },
              }),
            },
            mapProfileToUser: async (profile) => ({
              name: "",
              email: `${profile.sub}@inacademia.openhospi.nl`,
              emailVerified: false,
              image: null,
            }),
          },
        ],
      }),
      multiSession(),
      admin(),
      jwt(),
      bearer(),
      expo(),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;

function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
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
