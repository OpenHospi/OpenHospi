import { PDOK_LOOKUP_URL, PDOK_SUGGEST_URL, PDOK_SUGGESTION_LIMIT } from "./constants/external";

// ── PDOK API response types ──────────────────────────────────

export type PdokSuggestDoc = {
  id: string;
  weergavenaam: string;
  type: string;
  score: number;
};

export type PdokLookupDoc = {
  straatnaam: string;
  huisnummer: number;
  postcode: string;
  woonplaatsnaam: string;
  gemeentenaam: string;
  provincienaam: string;
  buurtnaam: string;
  centroide_ll: string;
};

export type PdokResponse<T> = {
  response: {
    numFound: number;
    start: number;
    docs: T[];
  };
};

// ── Application types ────────────────────────────────────────

export type AddressResult = {
  streetName: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  municipality: string;
  province: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
};

export type AddressSuggestion = {
  id: string;
  displayName: string;
};

export type CitySuggestion = {
  id: string;
  name: string;
};

// ── Utilities ────────────────────────────────────────────────

export function parseWktPoint(wkt: string): { latitude: number; longitude: number } | null {
  // Match PDOK WKT format: POINT(lon lat) where lon/lat are decimal numbers
  // Uses specific numeric pattern to avoid polynomial regex backtracking (CodeQL)
  const match = wkt.match(/^POINT\((-?[\d.]+) (-?[\d.]+)\)$/);
  if (!match) return null;
  return { longitude: Number.parseFloat(match[1]), latitude: Number.parseFloat(match[2]) };
}

// ── Server-side PDOK functions (used in proxy routes) ────────

export async function pdokSuggest(
  query: string,
  type: "adres" | "woonplaats",
): Promise<PdokSuggestDoc[]> {
  if (query.length < 2) return [];

  const url = `${PDOK_SUGGEST_URL}?q=${encodeURIComponent(query)}&fq=type:${type}&rows=${PDOK_SUGGESTION_LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as PdokResponse<PdokSuggestDoc>;
  return data.response?.docs ?? [];
}

export async function pdokLookup(id: string): Promise<PdokLookupDoc | null> {
  const url = `${PDOK_LOOKUP_URL}?id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as PdokResponse<PdokLookupDoc>;
  return data.response?.docs?.[0] ?? null;
}

export function mapLookupDocToAddress(doc: PdokLookupDoc): AddressResult | null {
  const coords = parseWktPoint(doc.centroide_ll ?? "");
  if (!coords) return null;

  return {
    streetName: doc.straatnaam ?? "",
    houseNumber: String(doc.huisnummer ?? ""),
    postalCode: doc.postcode ?? "",
    city: doc.woonplaatsnaam ?? "",
    municipality: doc.gemeentenaam ?? "",
    province: doc.provincienaam ?? "",
    neighborhood: doc.buurtnaam ?? "",
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

// ── Client-side functions (call proxy) ───────────────────────

export async function searchAddresses(
  query: string,
  baseUrl: string,
): Promise<AddressSuggestion[]> {
  if (query.length < 2) return [];

  const url = `${baseUrl}/suggest?q=${encodeURIComponent(query)}&type=adres`;
  const res = await fetch(url);
  if (!res.ok) return [];

  return (await res.json()) as AddressSuggestion[];
}

export async function lookupAddress(id: string, baseUrl: string): Promise<AddressResult | null> {
  const url = `${baseUrl}/lookup?id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  return (await res.json()) as AddressResult | null;
}

export async function searchCities(query: string, baseUrl: string): Promise<CitySuggestion[]> {
  if (query.length < 2) return [];

  const url = `${baseUrl}/suggest?q=${encodeURIComponent(query)}&type=woonplaats`;
  const res = await fetch(url);
  if (!res.ok) return [];

  return (await res.json()) as CitySuggestion[];
}
