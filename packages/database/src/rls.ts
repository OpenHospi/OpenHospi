import { sql } from "drizzle-orm";

import { db } from "./db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withRLS<T>(
  userId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    try {
      // Set JWT claims so auth.user_id() returns this user's ID
      // (official Neon pattern: https://neon.com/docs/guides/neon-authorize-drizzle)
      await tx.execute(
        sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`,
      );
      // Switch to authenticated role so RLS policies are enforced
      // (needed because our Pool connects as neondb_owner which has BYPASSRLS)
      // (from Drizzle docs createDrizzle pattern: https://orm.drizzle.team/docs/rls)
      await tx.execute(sql`set local role authenticated`);
      return await fn(tx);
    } finally {
      await tx.execute(sql`reset role`);
    }
  });
}
