import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "POSTGRES_URL environment variable is not set. " +
      "Set it in .env.local (local) or Vercel dashboard (production).",
  );
}

export const pool = new Pool({
  connectionString,
  max: 5,
  ssl: { rejectUnauthorized: false },
});
