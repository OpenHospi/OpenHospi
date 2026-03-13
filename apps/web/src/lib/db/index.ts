import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { relations } from "./schema/relations";

// Two separate connections: admin (bypasses RLS) and client (for RLS)
let _adminClient: ReturnType<typeof postgres> | null = null;
let _rlsClient: ReturnType<typeof postgres> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = postgres(process.env.POSTGRES_URL!, { prepare: false });
  }
  return _adminClient;
}

function getRlsClient() {
  if (!_rlsClient) {
    _rlsClient = postgres(process.env.POSTGRES_URL!, { prepare: false });
  }
  return _rlsClient;
}

type SupabaseToken = {
  sub?: string;
  role?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDrizzle(
  token: SupabaseToken,
  { admin, client }: { admin: PgDatabase<any>; client: PgDatabase<any> },
) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          try {
            await tx.execute(sql`
              select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(token))}', TRUE);
              select set_config('request.jwt.claim.sub', '${sql.raw(token.sub ?? "")}', TRUE);
              set local role ${sql.raw(token.role ?? "anon")};
            `);
            return await transaction(tx);
          } finally {
            await tx.execute(sql`
              select set_config('request.jwt.claims', NULL, TRUE);
              select set_config('request.jwt.claim.sub', NULL, TRUE);
              reset role;
            `);
          }
        },
        ...rest,
      );
    }) as typeof client.transaction,
  };
}

/**
 * Create a Drizzle client with RLS support for authenticated users.
 *
 * Usage:
 *   const db = createDrizzleSupabaseClient(userId);
 *   db.admin.select()...         ← bypasses RLS (provisioning, admin ops)
 *   db.rls(tx => tx.select()...) ← enforces RLS (user-scoped operations)
 */
export function createDrizzleSupabaseClient(userId: string) {
  const admin = drizzle({ client: getAdminClient(), schema, relations });
  const client = drizzle({ client: getRlsClient(), schema, relations });

  return createDrizzle({ sub: userId, role: "authenticated" }, { admin, client });
}

/**
 * Direct admin database connection (bypasses RLS).
 * Use for Better Auth provisioning, admin operations, cron jobs.
 *
 * Lazy-initialized proxy to defer connection until first use (required for Next.js build).
 */
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
