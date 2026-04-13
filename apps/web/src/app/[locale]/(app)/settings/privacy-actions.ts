"use server";

import type { ConsentPurpose } from "@openhospi/shared/enums";
import type {
  RequestProcessingRestrictionData,
  SubmitDataRequestData,
} from "@openhospi/validators";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireSession } from "@/lib/auth/server";
import {
  getActiveConsentsForUser,
  getConsentHistoryForUser,
  getProcessingRestrictionForUser,
  getUserDataRequestsForUser,
  liftProcessingRestrictionForUser,
  requestProcessingRestrictionForUser,
  submitDataRequestForUser,
  updateConsentForUser,
} from "@/lib/services/settings-mutations";

export async function updateConsent(purpose: ConsentPurpose, granted: boolean) {
  const session = await requireSession();
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  await updateConsentForUser(session.user.id, purpose, granted, ipAddress, userAgent);

  revalidatePath("/settings");
  return { success: true };
}

export async function getActiveConsents() {
  const session = await requireSession();
  return getActiveConsentsForUser(session.user.id);
}

export async function getConsentHistory() {
  const session = await requireSession();
  return getConsentHistoryForUser(session.user.id);
}

export async function submitDataRequest(data: SubmitDataRequestData) {
  const session = await requireSession();
  const result = await submitDataRequestForUser(session.user.id, data);
  if ("error" in result && result.error) return result;
  revalidatePath("/settings");
  return { success: true };
}

export async function requestProcessingRestriction(data: RequestProcessingRestrictionData) {
  const session = await requireSession();
  const result = await requestProcessingRestrictionForUser(session.user.id, data);
  if ("error" in result && result.error) return result;
  revalidatePath("/settings");
  return { success: true };
}

export async function liftProcessingRestriction() {
  const session = await requireSession();
  await liftProcessingRestrictionForUser(session.user.id);
  revalidatePath("/settings");
  return { success: true };
}

export async function getProcessingRestriction() {
  const session = await requireSession();
  return getProcessingRestrictionForUser(session.user.id);
}

export async function getUserDataRequests() {
  const session = await requireSession();
  return getUserDataRequestsForUser(session.user.id);
}
