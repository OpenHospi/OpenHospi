import { sql } from "drizzle-orm";

import { db } from "./db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withRLS<T>(userId: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // Set JWT claims so auth.uid() returns this user's ID
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`,
    );
    // Switch to authenticated role so RLS policies are enforced
    // (needed because our connection uses the postgres role which has BYPASSRLS)
    await tx.execute(sql`set local role authenticated`);
    return await fn(tx);
    // No finally/reset needed — SET LOCAL and set_config(..., true) are transaction-scoped
  });
}
