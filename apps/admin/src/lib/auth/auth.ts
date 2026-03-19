import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@openhospi/database";
import * as schema from "@openhospi/database/schema";

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
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://localhost:3001"]
        : []),
    ],
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        disableSignUp: process.env.GITHUB_DISABLE_SIGNUP !== "false",
      },
    },
    plugins: [admin(), nextCookies()],
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
