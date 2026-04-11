import { sql } from "drizzle-orm";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type * as schema from "./schema";

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

type DB = PostgresJsDatabase<typeof schema>;

// drizzle-orm v1 beta has broken overload types for the object config form.
// The runtime handles { client } correctly — this assertion is only needed for TS.
function createDrizzleClient(client: ReturnType<typeof postgres>): DB {
  return drizzle({ client } as any);
}

function createDrizzle(token: SupabaseToken, { admin, client }: { admin: DB; client: DB }) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          // set_config with TRUE = transaction-local, auto-reverts on COMMIT/ROLLBACK
          // SET LOCAL ROLE also auto-reverts — no manual cleanup needed
          await tx.execute(sql`
            select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(token))}', TRUE);
            select set_config('request.jwt.claim.sub', '${sql.raw(token.sub ?? "")}', TRUE);
            set local role ${sql.raw(token.role ?? "anon")};
          `);
          return await transaction(tx);
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
  const admin = createDrizzleClient(getAdminClient());
  const client = createDrizzleClient(getRlsClient());

  return createDrizzle({ sub: userId, role: "authenticated" }, { admin, client });
}

/**
 * Direct admin database connection (bypasses RLS).
 * Use for Better Auth provisioning, admin operations, cron jobs.
 *
 * Lazy-initialized proxy to defer connection until first use (required for Next.js build).
 */
let _adminDb: DB | null = null;

function getAdminDb(): DB {
  if (!_adminDb) {
    _adminDb = createDrizzleClient(getAdminClient());
  }
  return _adminDb;
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getAdminDb(), prop);
  },
});
