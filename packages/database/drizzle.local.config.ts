import 'dotenv/config';
import {defineConfig} from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/index.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    },
    schemaFilter: ["public"],
    entities: {roles: {provider: "supabase"}},
});
