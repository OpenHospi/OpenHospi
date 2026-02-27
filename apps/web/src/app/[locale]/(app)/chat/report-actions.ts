"use server";

// Re-export from shared location — report actions are not chat-specific
export { reportMessage, reportUser, reportRoom } from "@/lib/report-actions";
