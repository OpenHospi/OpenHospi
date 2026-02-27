import dotenv from "dotenv";
import {existsSync} from "node:fs";
import {defineConfig} from "drizzle-kit";

// Load .env.local from monorepo root for local dev; on Vercel env vars are injected automatically
const envPath = "../../.env.local";
if (existsSync(envPath)) dotenv.config({path: envPath});

export default defineConfig({
    schema: "./src/schema/index.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!
    },
    schemaFilter: ["public"],
    entities: {
        roles: {
            provider: "supabase"
        }
    },
});
