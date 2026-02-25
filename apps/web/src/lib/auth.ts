import { sso } from "@better-auth/sso";
import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";


export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      ssoProvider: schema.ssoProvider,
    },
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  experimental: {
    joins: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    "https://*.openhospi.nl",
    "https://connect.test.surfconext.nl",
    "https://connect.surfconext.nl",
  ],
  accountLinking: { enabled: false },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              email: `${user.id}@id.openhospi.nl`,
              emailVerified: true,
            },
          };
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
        const affiliations = (userInfo.eduperson_affiliation as string[]) || [];
        const affiliation = affiliations.includes("employee") ? "employee" : "student";

        await db
          .insert(schema.profiles)
          .values({
            id: user.id,
            firstName,
            lastName,
            email,
            institutionDomain: institution,
            affiliation: affiliation as "student" | "employee",
          })
          .onConflictDoUpdate({
            target: schema.profiles.id,
            set: {
              email,
              firstName,
              lastName,
              institutionDomain: institution,
              affiliation: affiliation as "student" | "employee",
              lastLoginAt: new Date(),
            },
          });
      },
    }),
    nextCookies(),
  ],
});
