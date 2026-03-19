import { existsSync } from "node:fs";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.prod from monorepo root for production
const envPath = "../../.env.prod";
if (existsSync(envPath)) config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in .env.prod or environment.");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
});
