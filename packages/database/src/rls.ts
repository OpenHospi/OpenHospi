import { createDrizzleSupabaseClient } from "./index";

type RlsFn = ReturnType<typeof createDrizzleSupabaseClient>["rls"];
type RlsTx = Parameters<Parameters<RlsFn>[0]>[0];

/**
 * Canonical helper for running a transaction under Supabase RLS.
 *
 * Sets `request.jwt.claims.sub = userId`, switches to the `authenticated`
 * role for the duration of the transaction, then restores on commit/rollback.
 *
 *   await withRLS(userId, async (tx) => {
 *     return tx.select().from(rooms).where(eq(rooms.ownerId, userId));
 *   });
 */
export function withRLS<T>(userId: string, fn: (tx: RlsTx) => Promise<T>): Promise<T> {
  const { rls } = createDrizzleSupabaseClient(userId);
  return rls(fn);
}
