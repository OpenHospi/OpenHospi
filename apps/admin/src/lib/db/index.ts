
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { relations } from "./schema/relations";

let _adminClient: ReturnType<typeof postgres> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = postgres(process.env.POSTGRES_URL!, { prepare: false });
  }
  return _adminClient;
}

type AdminDB = ReturnType<typeof drizzle<typeof schema, typeof relations>>;

let _adminDb: AdminDB | null = null;

function getAdminDb(): AdminDB {
  if (!_adminDb) {
    _adminDb = drizzle({ client: getAdminClient(), schema, relations });
  }
  return _adminDb;
}

export const db: AdminDB = new Proxy({} as AdminDB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getAdminDb(), prop);
  },
});
