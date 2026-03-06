import { withRLS } from "@openhospi/database";
import { applicationStatusHistory } from "@openhospi/database/schema";
import type { ApplicationStatus } from "@openhospi/shared/enums";

type RLSTransaction = Parameters<Parameters<typeof withRLS>[1]>[0];

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
