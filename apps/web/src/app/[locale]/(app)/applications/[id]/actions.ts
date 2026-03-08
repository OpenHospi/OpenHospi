"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import { withdrawApplicationForUser } from "@/lib/services/application-mutations";

export async function withdrawApplication(applicationId: string) {
  const session = await requireSession();

  const result = await withdrawApplicationForUser(session.user.id, applicationId);

  if ("success" in result) {
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/applications");
  }

  return result;
}
