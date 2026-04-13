import { PDOK_CACHE_TTL_MS } from "@openhospi/shared/constants/external";
import type { AddressResult } from "@openhospi/shared/pdok";
import { mapLookupDocToAddress, pdokLookup } from "@openhospi/shared/pdok";
import { type NextRequest, NextResponse } from "next/server";

// Simple in-memory LRU cache for PDOK lookup responses
const cache = new Map<string, { data: AddressResult | null; expiresAt: number }>();
const MAX_CACHE_SIZE = 200;

function getCached(key: string): AddressResult | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: AddressResult | null): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + PDOK_CACHE_TTL_MS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id") ?? "";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const cacheKey = `lookup:${id}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) {
    return NextResponse.json(cached);
  }

  const doc = await pdokLookup(id);
  const result = doc ? mapLookupDocToAddress(doc) : null;

  setCache(cacheKey, result);
  return NextResponse.json(result);
}
