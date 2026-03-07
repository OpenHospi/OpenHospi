import { createHash } from "node:crypto";

import { expo } from "@better-auth/expo";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, genericOAuth, jwt, multiSession } from "better-auth/plugins";
import { and, eq, gt } from "drizzle-orm";

import { sendTemplatedEmail } from "@/lib/services/email";

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

function createAuth() {
  // baseURL is intentionally omitted — derived per-request from
  // X-Forwarded-Host/Proto (Vercel), falling back to request origin (localhost).
  // BETTER_AUTH_URL must also be unset on Vercel for this to work.
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
      "https://op.srv.inacademia.org",
      "openhospi://",
      ...(process.env.NODE_ENV === "development"
        ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
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

        // Determine user locale from profile (fall back to nl)
        let locale: "nl" | "en" | "de" = "nl";
        try {
          const [profile] = await db
            .select({ preferredLocale: schema.profiles.preferredLocale })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, user.id));
          if (profile?.preferredLocale === "en" || profile?.preferredLocale === "de") {
            locale = profile.preferredLocale;
          }
        } catch {
          // Profile may not exist yet during onboarding — use default
        }

        void sendTemplatedEmail(user.email, "verificationCode", { code }, locale);
      },
      autoSignInAfterVerification: true,
      expiresIn: 3600,
    },
    accountLinking: { enabled: true, trustedProviders: ["github"] },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        disableSignUp: process.env.GITHUB_DISABLE_SIGNUP !== "false",
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // Keep real email in dev (GitHub login) or during admin bootstrap.
            // Normal operation: always replace with placeholder.
            const keepRealEmail =
              process.env.GITHUB_DISABLE_SIGNUP === "false" ||
              process.env.NODE_ENV === "development";
            return {
              data: {
                ...user,
                email: keepRealEmail ? user.email : `${user.id}@id.openhospi.nl`,
                emailVerified: false,
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
              // Dev path: create profile from GitHub data
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

            // Production path: extract idp_hint from account's ID token
            let entityId = "";
            try {
              const [account] = await db
                .select({ idToken: schema.account.idToken })
                .from(schema.account)
                .where(eq(schema.account.userId, user.id));
              if (account?.idToken) {
                const payload = JSON.parse(
                  Buffer.from(account.idToken.split(".")[1]!, "base64url").toString(),
                );
                entityId = (payload.idp_hint as string) ?? "";
              }
            } catch {
              // ID token decode failed — proceed with empty entity ID
            }

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
            clientId: process.env.INACADEMIA_CLIENT_ID!,
            clientSecret: process.env.INACADEMIA_CLIENT_SECRET!,
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
