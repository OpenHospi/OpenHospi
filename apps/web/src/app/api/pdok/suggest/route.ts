import { PDOK_CACHE_TTL_MS } from "@openhospi/shared/constants/external";
import type { AddressSuggestion, CitySuggestion } from "@openhospi/shared/pdok";
import { pdokSuggest } from "@openhospi/shared/pdok";
import { type NextRequest, NextResponse } from "next/server";

// Simple in-memory LRU cache for PDOK suggest responses
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const MAX_CACHE_SIZE = 200;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  // Evict oldest entries when cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + PDOK_CACHE_TTL_MS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type") as "adres" | "woonplaats" | null;

  if (!type || !["adres", "woonplaats"].includes(type)) {
    return NextResponse.json({ error: "type must be 'adres' or 'woonplaats'" }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = `suggest:${type}:${query.toLowerCase()}`;
  const cached = getCached<unknown[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const docs = await pdokSuggest(query, type);

  let results: AddressSuggestion[] | CitySuggestion[];

  if (type === "adres") {
    results = docs.map((doc) => ({
      id: doc.id,
      displayName: doc.weergavenaam,
    }));
  } else {
    results = docs.map((doc) => ({
      id: doc.id,
      name: doc.weergavenaam.split(",")[0].trim(),
    }));
  }

  setCache(cacheKey, results);
  return NextResponse.json(results);
}
