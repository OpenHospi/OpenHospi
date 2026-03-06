"use server";

import { db, withRLS } from "@openhospi/database";
import { houseMembers, houses } from "@openhospi/database/schema";
import type { Locale } from "@openhospi/i18n";
import { HouseMemberRole } from "@openhospi/shared/enums";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { requireNotRestricted, requireSession } from "@/lib/auth/server";

export async function createHouse(formData: FormData): Promise<void> {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) throw new Error(restricted.error);

  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    throw new Error("invalid_name");
  }

  const houseId = crypto.randomUUID();

  await withRLS(session.user.id, async (tx) => {
    await tx.insert(houses).values({
      id: houseId,
      name: name.trim(),
      createdBy: session.user.id,
    });

    await tx.insert(houseMembers).values({
      houseId,
      userId: session.user.id,
      role: HouseMemberRole.owner,
    });
  });

  const locale = (await getLocale()) as Locale;
  redirect({ href: "/my-house", locale });
}

export async function regenerateInviteCode() {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  // Uses db directly — owner needs to update their own house
  await db
    .update(houses)
    .set({ inviteCode: crypto.randomUUID() })
    .where(eq(houses.createdBy, session.user.id));

  revalidatePath("/my-house");
  return { success: true };
}
