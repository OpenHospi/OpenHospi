import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { relations } from "./schema/relations";

type DB = NeonHttpDatabase<typeof schema, typeof relations>;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    _db = drizzle(process.env.DATABASE_URL!, { schema, relations });
  }
  return _db;
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});
