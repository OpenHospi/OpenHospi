import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { relations } from "./schema/relations";

type DB = PostgresJsDatabase<typeof schema, typeof relations>;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    const client = postgres(process.env.POSTGRES_URL!, { prepare: false });
    _db = drizzle({ client, schema, relations });
  }
  return _db;
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});
