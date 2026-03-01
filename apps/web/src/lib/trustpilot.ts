import { unstable_cache } from "next/cache";

const TRUSTPILOT_REVIEW_URL = "https://nl.trustpilot.com/review/openhospi.nl";

export interface TrustpilotData {
  score: number;
  reviewCount: number;
}

async function fetchTrustpilotData(): Promise<TrustpilotData> {
  try {
    const res = await fetch(TRUSTPILOT_REVIEW_URL, {
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
  revalidate: 86400,
});
