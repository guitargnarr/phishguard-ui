import areaCodeData from "./data/us-area-codes.json";

export interface AreaCodeInfo {
  code: string;
  state: string;
  stateName: string;
  region: string;
  majorCities: string[];
}

export interface PhoneEnrichment {
  areaCode: string;
  geo: AreaCodeInfo | null;
  isTollFree: boolean;
}

const TOLL_FREE_CODES = new Set([
  "800",
  "833",
  "844",
  "855",
  "866",
  "877",
  "888",
]);

const byCode = areaCodeData.by_area_code as Record<
  string,
  { state: string; state_name: string; region: string; major_cities: string[] }
>;

/** Extract 3-digit area code from a phone string */
export function parseAreaCode(phone: string): string | null {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");
  // US numbers: 10 digits or 11 with leading 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1, 4);
  }
  if (digits.length === 10) {
    return digits.slice(0, 3);
  }
  // Try to find 3 consecutive digits that match an area code
  if (digits.length >= 3) {
    return digits.slice(0, 3);
  }
  return null;
}

/** Look up an area code to get geographic info */
export function lookupAreaCode(code: string): AreaCodeInfo | null {
  const entry = byCode[code];
  if (!entry) return null;
  return {
    code,
    state: entry.state,
    stateName: entry.state_name,
    region: entry.region,
    majorCities: entry.major_cities,
  };
}

/** Full phone enrichment: parse + lookup + toll-free detection */
export function enrichPhone(phone: string): PhoneEnrichment {
  const areaCode = parseAreaCode(phone);
  if (!areaCode) {
    return { areaCode: "", geo: null, isTollFree: false };
  }
  return {
    areaCode,
    geo: lookupAreaCode(areaCode),
    isTollFree: TOLL_FREE_CODES.has(areaCode),
  };
}

/** Aggregate state counts from a list of phone numbers (for map coloring) */
export function getStateStats(phones: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const phone of phones) {
    const { geo } = enrichPhone(phone);
    if (geo) {
      counts.set(geo.state, (counts.get(geo.state) || 0) + 1);
    }
  }
  return counts;
}
