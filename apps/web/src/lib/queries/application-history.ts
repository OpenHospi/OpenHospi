import type { ApplicationStatus } from "@openhospi/shared/enums";

import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applicationStatusHistory } from "@openhospi/database/schema";

type RLSTransaction = Parameters<
  Parameters<ReturnType<typeof createDrizzleSupabaseClient>["rls"]>[0]
>[0];

export async function logStatusTransition(
  tx: RLSTransaction,
  applicationId: string,
  fromStatus: ApplicationStatus | null,
  toStatus: ApplicationStatus,
  changedBy: string,
) {
  await tx.insert(applicationStatusHistory).values({
    applicationId,
    fromStatus,
    toStatus,
    changedBy,
  });
}
