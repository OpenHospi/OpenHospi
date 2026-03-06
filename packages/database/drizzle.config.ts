import {existsSync} from "node:fs";

import dotenv from "dotenv";
import {defineConfig} from "drizzle-kit";

// Load .env.local from monorepo root for local dev; on Vercel env vars are injected automatically
const envPath = "../../.env.prod";
if (existsSync(envPath)) dotenv.config({path: envPath});

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required. Set it in .env.local or environment.",
    );
}

export default defineConfig({
    schema: "./src/schema/index.ts",
    dialect: "postgresql",
    dbCredentials: {url: process.env.DATABASE_URL},
    schemaFilter: ["public"],
    entities: {roles: {provider: "supabase"}},
});
