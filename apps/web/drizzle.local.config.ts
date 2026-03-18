import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
});
