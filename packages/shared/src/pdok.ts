import { PDOK_LOOKUP_URL, PDOK_SUGGEST_URL, PDOK_SUGGESTION_LIMIT } from "./constants/external";

// ── Types ───────────────────────────────────────────────────

export type AddressResult = {
  streetName: string;
  houseNumber: string;
  postalCode: string;
  city: string;
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

// ── Utilities ───────────────────────────────────────────────

export function parseWktPoint(wkt: string): { latitude: number; longitude: number } | null {
  // Match PDOK WKT format: POINT(lon lat) where lon/lat are decimal numbers
  // Uses specific numeric pattern to avoid polynomial regex backtracking (CodeQL)
  const match = wkt.match(/^POINT\((-?[\d.]+) (-?[\d.]+)\)$/);
  if (!match) return null;
  return { longitude: Number.parseFloat(match[1]), latitude: Number.parseFloat(match[2]) };
}

// ── Address Search (for room creation) ──────────────────────

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 2) return [];

  const url = `${PDOK_SUGGEST_URL}?q=${encodeURIComponent(query)}&fq=type:adres&rows=${PDOK_SUGGESTION_LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.response?.docs ?? []).map((doc: { id: string; weergavenaam: string }) => ({
    id: doc.id,
    displayName: doc.weergavenaam,
  }));
}

export async function lookupAddress(id: string): Promise<AddressResult | null> {
  const url = `${PDOK_LOOKUP_URL}?id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const doc = data.response?.docs?.[0];
  if (!doc) return null;

  const coords = parseWktPoint(doc.centroide_ll ?? "");
  if (!coords) return null;

  return {
    streetName: doc.straatnaam ?? "",
    houseNumber: String(doc.huisnummer ?? ""),
    postalCode: doc.postcode ?? "",
    city: doc.woonplaatsnaam ?? "",
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

// ── City Search (for preferred city / filters) ──────────────

export async function searchCities(query: string): Promise<CitySuggestion[]> {
  if (query.length < 2) return [];

  const url = `${PDOK_SUGGEST_URL}?q=${encodeURIComponent(query)}&fq=type:woonplaats&rows=${PDOK_SUGGESTION_LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.response?.docs ?? []).map((doc: { id: string; woonplaatsnaam: string }) => ({
    id: doc.id,
    name: doc.woonplaatsnaam,
  }));
}
