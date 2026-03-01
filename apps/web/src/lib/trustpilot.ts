import { TRUSTPILOT_CACHE_REVALIDATE_SECONDS, TRUSTPILOT_URL } from "@openhospi/shared/constants";
import { unstable_cache } from "next/cache";

export interface TrustpilotData {
  score: number;
  reviewCount: number;
}

async function fetchTrustpilotData(): Promise<TrustpilotData> {
  try {
    const res = await fetch(TRUSTPILOT_URL, {
      headers: { "User-Agent": "OpenHospi/1.0" },
    });

    if (!res.ok) return { score: 0, reviewCount: 0 };

    const html = await res.text();

    const scoreMatch = html.match(/TrustScore\s+([\d.]+)/);
    const reviewCountMatch = html.match(/"reviewCount":(\d+)/);

    return {
      score: scoreMatch ? Number(scoreMatch[1]) : 0,
      reviewCount: reviewCountMatch ? Number(reviewCountMatch[1]) : 0,
    };
  } catch {
    return { score: 0, reviewCount: 0 };
  }
}

export const getTrustpilotData = unstable_cache(fetchTrustpilotData, ["trustpilot-data"], {
  revalidate: TRUSTPILOT_CACHE_REVALIDATE_SECONDS,
});
