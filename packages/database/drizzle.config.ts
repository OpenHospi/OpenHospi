import dotenv from "dotenv";
import {existsSync} from "node:fs";
import {defineConfig} from "drizzle-kit";

// Load .env.local from monorepo root for local dev; on Vercel env vars are injected automatically
const envPath = "../../.env.local";
if (existsSync(envPath)) dotenv.config({path: envPath});

export default defineConfig({
    schema: "./src/schema/index.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.POSTGRES_HOST!,
        port: 5432,
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DATABASE!,
        ssl: "require",
    },
    schemaFilter: ["public"],
    entities: {
        roles: {
            provider: "supabase"
        }
    },
});
