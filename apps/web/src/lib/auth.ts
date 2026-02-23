import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { pool } from "./db";

export const auth = betterAuth({
  database: pool,
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
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

        await pool.query(
          `INSERT INTO profiles (id, first_name, last_name, email, institution_domain, affiliation)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             institution_domain = EXCLUDED.institution_domain,
             affiliation = EXCLUDED.affiliation,
             last_login_at = NOW()`,
          [user.id, firstName, lastName, email, institution, affiliation],
        );
      },
    }),
    nextCookies(),
  ],
});
