"use server";

import { db, withRLS } from "@openhospi/database";
import {
  activeConsents,
  consentRecords,
  dataRequests,
  processingRestrictions,
} from "@openhospi/database/schema";
import {
  requestProcessingRestrictionSchema,
  submitDataRequestSchema,
  type RequestProcessingRestrictionData,
  type SubmitDataRequestData,
} from "@openhospi/database/validators";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import type { ConsentPurpose, LegalBasis } from "@openhospi/shared/enums";
import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireSession } from "@/lib/auth-server";

const PURPOSE_LEGAL_BASIS: Record<ConsentPurpose, LegalBasis> = {
  essential: "contract",
  functional: "consent",
  push_notifications: "consent",
  analytics: "consent",
};

export async function updateConsent(purpose: ConsentPurpose, granted: boolean) {
  const session = await requireSession();
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  await db.transaction(async (tx) => {
    await tx.insert(consentRecords).values({
      userId: session.user.id,
      purpose,
      granted,
      legalBasis: PURPOSE_LEGAL_BASIS[purpose],
      ipAddress,
      userAgent,
      version: PRIVACY_POLICY_VERSION,
    });

    await tx
      .insert(activeConsents)
      .values({
        userId: session.user.id,
        purpose,
        granted,
      })
      .onConflictDoUpdate({
        target: [activeConsents.userId, activeConsents.purpose],
        set: { granted, lastUpdatedAt: new Date() },
      });
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getActiveConsents() {
  const session = await requireSession();
  return withRLS(session.user.id, (tx) =>
    tx.select().from(activeConsents).where(eq(activeConsents.userId, session.user.id)),
  );
}

export async function getConsentHistory() {
  const session = await requireSession();
  return withRLS(session.user.id, (tx) =>
    tx
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, session.user.id))
      .orderBy(desc(consentRecords.createdAt))
      .limit(50),
  );
}

export async function submitDataRequest(data: SubmitDataRequestData) {
  const session = await requireSession();
  const parsed = submitDataRequestSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await withRLS(session.user.id, (tx) =>
    tx.insert(dataRequests).values({
      userId: session.user.id,
      type: parsed.data.type,
      description: parsed.data.description,
    }),
  );

  revalidatePath("/settings");
  return { success: true };
}

export async function requestProcessingRestriction(data: RequestProcessingRestrictionData) {
  const session = await requireSession();
  const parsed = requestProcessingRestrictionSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await withRLS(session.user.id, (tx) =>
    tx
      .insert(processingRestrictions)
      .values({
        userId: session.user.id,
        reason: parsed.data.reason,
      })
      .onConflictDoUpdate({
        target: [processingRestrictions.userId],
        set: {
          restrictedAt: new Date(),
          reason: parsed.data.reason,
          liftedAt: null,
          liftedBy: null,
        },
      }),
  );

  revalidatePath("/settings");
  return { success: true };
}

export async function liftProcessingRestriction() {
  const session = await requireSession();

  await db
    .update(processingRestrictions)
    .set({ liftedAt: new Date(), liftedBy: session.user.id })
    .where(
      and(
        eq(processingRestrictions.userId, session.user.id),
        isNull(processingRestrictions.liftedAt),
      ),
    );

  revalidatePath("/settings");
  return { success: true };
}

export async function getProcessingRestriction() {
  const session = await requireSession();
  const [restriction] = await withRLS(session.user.id, (tx) =>
    tx
      .select()
      .from(processingRestrictions)
      .where(
        and(
          eq(processingRestrictions.userId, session.user.id),
          isNull(processingRestrictions.liftedAt),
        ),
      )
      .limit(1),
  );
  return restriction ?? null;
}

export async function getUserDataRequests() {
  const session = await requireSession();
  return withRLS(session.user.id, (tx) =>
    tx
      .select()
      .from(dataRequests)
      .where(eq(dataRequests.userId, session.user.id))
      .orderBy(desc(dataRequests.createdAt))
      .limit(20),
  );
}
