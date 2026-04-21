import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";
import { relations } from "./schema/relations";

export type DB = PostgresJsDatabase<typeof schema, typeof relations>;

type SupabaseToken = {
  sub?: string;
  role?: string;
};

// Supabase role names that set_local can switch to. Validated against an
// allow-list before being spliced into the `SET LOCAL ROLE` statement.
const ALLOWED_SUPABASE_ROLES = new Set(["anon", "authenticated", "service_role", "postgres"]);

function requireUrl(): string {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is required");
  return url;
}

function createDb(): DB {
  return drizzle({
    connection: { url: requireUrl(), prepare: false },
    schema,
    relations,
  });
}

function createDrizzle(token: SupabaseToken, { admin, client }: { admin: DB; client: DB }) {
  const role = token.role ?? "anon";
  if (!ALLOWED_SUPABASE_ROLES.has(role)) {
    throw new Error(`Refusing to switch to unknown Postgres role: ${JSON.stringify(role)}`);
  }

  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          // set_config third-arg TRUE = transaction-local, auto-reverts on COMMIT/ROLLBACK.
          // SET LOCAL ROLE auto-reverts for the same reason — no manual cleanup needed.
          await tx.execute(
            sql`select set_config('request.jwt.claims', ${JSON.stringify(token)}, true)`,
          );
          await tx.execute(
            sql`select set_config('request.jwt.claim.sub', ${token.sub ?? ""}, true)`,
          );
          // Role is an identifier, not a bindable parameter. Safe because we validated
          // against ALLOWED_SUPABASE_ROLES above.
          await tx.execute(sql`set local role ${sql.identifier(role)}`);
          return await transaction(tx);
        },
        ...rest,
      );
    }) as typeof client.transaction,
  };
}

// Two independent drizzle instances: one for bypass-RLS admin ops, one for
// RLS-enforced per-request transactions. Both lazily initialized so importing
// this module does not open a connection (required for Next.js build).
let _adminDb: DB | null = null;
let _rlsDb: DB | null = null;

function getAdminDb(): DB {
  if (!_adminDb) _adminDb = createDb();
  return _adminDb;
}

function getRlsDb(): DB {
  if (!_rlsDb) _rlsDb = createDb();
  return _rlsDb;
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
  return createDrizzle(
    { sub: userId, role: "authenticated" },
    { admin: getAdminDb(), client: getRlsDb() },
  );
}

/**
 * Direct admin database connection (bypasses RLS).
 * Use for Better Auth provisioning, admin operations, cron jobs.
 */
export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getAdminDb(), prop);
  },
});

export { withRLS } from "./rls";
