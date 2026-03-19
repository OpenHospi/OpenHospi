"use server";

import { onPageFeedbackAction as action } from "./github";

export async function onPageFeedbackAction(feedback: {
  url: string;
  opinion: string;
  message: string;
}) {
  return action(feedback);
}
