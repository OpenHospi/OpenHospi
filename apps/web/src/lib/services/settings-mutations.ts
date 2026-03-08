import { db, withRLS } from "@openhospi/database";
import {
  activeConsents,
  consentRecords,
  dataRequests,
  processingRestrictions,
  profiles,
  user,
} from "@openhospi/database/schema";
import {
  requestProcessingRestrictionSchema,
  submitDataRequestSchema,
  type RequestProcessingRestrictionData,
  type SubmitDataRequestData,
} from "@openhospi/database/validators";
import { SUPPORTED_LOCALES, type Locale } from "@openhospi/i18n";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import type { ConsentPurpose, LegalBasis } from "@openhospi/shared/enums";
import { and, desc, eq, isNull } from "drizzle-orm";

const PURPOSE_LEGAL_BASIS: Record<ConsentPurpose, LegalBasis> = {
  essential: "contract",
  functional: "consent",
  push_notifications: "consent",
  analytics: "consent",
};

export async function updateConsentForUser(
  userId: string,
  purpose: ConsentPurpose,
  granted: boolean,
  ipAddress: string | null,
  userAgent: string | null,
) {
  await db.transaction(async (tx) => {
    await tx.insert(consentRecords).values({
      userId,
      purpose,
      granted,
      legalBasis: PURPOSE_LEGAL_BASIS[purpose],
      ipAddress,
      userAgent,
      version: PRIVACY_POLICY_VERSION,
    });

    await tx
      .insert(activeConsents)
      .values({ userId, purpose, granted })
      .onConflictDoUpdate({
        target: [activeConsents.userId, activeConsents.purpose],
        set: { granted, lastUpdatedAt: new Date() },
      });
  });

  return { success: true };
}

export async function getActiveConsentsForUser(userId: string) {
  return withRLS(userId, (tx) =>
    tx.select().from(activeConsents).where(eq(activeConsents.userId, userId)),
  );
}

export async function submitDataRequestForUser(userId: string, data: SubmitDataRequestData) {
  const parsed = submitDataRequestSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  await withRLS(userId, (tx) =>
    tx.insert(dataRequests).values({
      userId,
      type: parsed.data.type,
      description: parsed.data.description,
    }),
  );

  return { success: true };
}

export async function requestProcessingRestrictionForUser(
  userId: string,
  data: RequestProcessingRestrictionData,
) {
  const parsed = requestProcessingRestrictionSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  await withRLS(userId, (tx) =>
    tx
      .insert(processingRestrictions)
      .values({ userId, reason: parsed.data.reason })
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

  return { success: true };
}

export async function updatePreferredLocaleForUser(userId: string, locale: Locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return { error: "INVALID_LOCALE" as const };
  }

  await withRLS(userId, (tx) =>
    tx.update(profiles).set({ preferredLocale: locale }).where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function getProcessingRestrictionForUser(userId: string) {
  const [restriction] = await withRLS(userId, (tx) =>
    tx
      .select()
      .from(processingRestrictions)
      .where(
        and(eq(processingRestrictions.userId, userId), isNull(processingRestrictions.liftedAt)),
      )
      .limit(1),
  );
  return restriction ?? null;
}

export async function getUserDataRequestsForUser(userId: string) {
  return withRLS(userId, (tx) =>
    tx
      .select()
      .from(dataRequests)
      .where(eq(dataRequests.userId, userId))
      .orderBy(desc(dataRequests.createdAt))
      .limit(20),
  );
}

export async function deleteAccountForUser(userId: string) {
  const { deletePhotoFromStorage } = await import("@/lib/services/photos");
  const { profilePhotos, rooms, roomPhotos } = await import("@openhospi/database/schema");
  const { profiles: profilesTable } = await import("@openhospi/database/schema");

  const photoUrls = await withRLS(userId, async (tx) => {
    const pPhotos = await tx
      .select({ url: profilePhotos.url })
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId));

    const userRooms = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.ownerId, userId));

    const rPhotoUrls: string[] = [];
    for (const room of userRooms) {
      const rPhotos = await tx
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, room.id));
      rPhotoUrls.push(...rPhotos.map((p) => p.url));
    }

    return [...pPhotos.map((p) => p.url), ...rPhotoUrls];
  });

  for (const url of photoUrls) {
    try {
      await deletePhotoFromStorage(url);
    } catch {
      // Continue even if blob deletion fails
    }
  }

  await db.delete(profilesTable).where(eq(profilesTable.id, userId));
  await db.delete(user).where(eq(user.id, userId));

  return { success: true };
}
