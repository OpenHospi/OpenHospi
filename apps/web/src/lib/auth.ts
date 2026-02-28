import { sso } from "@better-auth/sso";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, jwt } from "better-auth/plugins";
import { eq } from "drizzle-orm";

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
    // NOTE: experimental.joins is disabled due to incompatibility between
    // Better Auth and drizzle-orm v1.0.0-beta (Unknown relational filter: "decoder")
    trustedOrigins: [
      "https://*.openhospi.nl",
      "https://connect.test.surfconext.nl",
      "https://connect.surfconext.nl",
    ],
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
                emailVerified: true,
              },
            };
          },
          after: async (user) => {
            if (process.env.NODE_ENV !== "development") return;

            const [existing] = await db
              .select({ id: schema.profiles.id })
              .from(schema.profiles)
              .where(eq(schema.profiles.id, user.id));
            if (existing) return;

            const nameParts = (user.name ?? "Dev User").split(" ");
            await db
              .insert(schema.profiles)
              .values({
                id: user.id,
                firstName: nameParts[0] || "Dev",
                lastName: nameParts.slice(1).join(" ") || "User",
                email: user.email,
                institutionDomain: "hanze.nl",
              })
              .onConflictDoNothing();
          },
        },
      },
    },
    plugins: [
      sso({
        provisionUser: async ({ user, userInfo }) => {
          const firstName = (userInfo.given_name as string) || "Unknown";
          const lastName = (userInfo.family_name as string) || "";
          const sub = userInfo.sub as string;
          const email = (userInfo.email as string) || `${sub}@surfconext.openhospi.nl`;
          const institution = (userInfo.schac_home_organization as string) || "unknown";

          await db
            .insert(schema.profiles)
            .values({
              id: user.id,
              firstName,
              lastName,
              email,
              institutionDomain: institution,
            })
            .onConflictDoUpdate({
              target: schema.profiles.id,
              set: {
                email,
                firstName,
                lastName,
                institutionDomain: institution,
                lastLoginAt: new Date(),
              },
            });
        },
      }),
      admin(),
      jwt(),
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
