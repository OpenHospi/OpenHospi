import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

import * as schema from "./schema";
import { relations } from "./schema/relations";

type DB = NeonDatabase<typeof schema, typeof relations>;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    _db = drizzle({ client: pool, schema, relations });
  }
  return _db;
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});
