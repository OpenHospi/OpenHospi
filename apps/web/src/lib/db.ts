import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
