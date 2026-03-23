import { defineEnum } from "./utils/define-enum";

export const ConsentPurpose = defineEnum([
  "essential",
  "functional",
  "push_notifications",
  "analytics",
] as const);
export type ConsentPurpose = (typeof ConsentPurpose.values)[number];

export const LegalBasis = defineEnum([
  "consent",
  "contract",
  "legal_obligation",
  "legitimate_interest",
] as const);
export type LegalBasis = (typeof LegalBasis.values)[number];

export const DataRequestType = defineEnum([
  "access",
  "rectification",
  "erasure",
  "restriction",
  "portability",
  "objection",
] as const);
export type DataRequestType = (typeof DataRequestType.values)[number];

export const DataRequestStatus = defineEnum([
  "pending",
  "in_progress",
  "completed",
  "denied",
] as const);
export type DataRequestStatus = (typeof DataRequestStatus.values)[number];
