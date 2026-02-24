import { Pool } from "pg";

const raw = process.env.POSTGRES_URL;

if (!raw) {
  throw new Error(
    "POSTGRES_URL environment variable is not set. " +
      "Set it in .env.local (local) or Vercel dashboard (production).",
  );
}

// Strip sslmode from the connection string — pg v8 treats sslmode=require
// as verify-full which rejects Supabase's CA. We handle SSL explicitly below.
const url = new URL(raw);
url.searchParams.delete("sslmode");
const connectionString = url.toString();

export const pool = new Pool({
  connectionString,
  max: 5,
  ssl: { rejectUnauthorized: false },
});
