import { NextResponse } from "next/server";

// BLS LAUS (Local Area Unemployment Statistics) v2 API
// Series ID format: LASST{FIPS}0000000000003 (seasonally adjusted unemployment rate)
// Public API: 500 requests/day without key, 500 series per request

// FIPS to state abbreviation (50 states + DC)
const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

interface BLSCache {
  data: Record<string, { unemploymentRate: number }>;
  timestamp: number;
}

let cache: BLSCache | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cache.data, source: "cache" });
  }

  try {
    // Build series IDs for all 51 areas (50 states + DC)
    const seriesIds = Object.keys(FIPS_TO_ABBR).map(
      (fips) => `LASST${fips}0000000000003`
    );

    const currentYear = new Date().getFullYear();

    const response = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: String(currentYear - 1),
        endyear: String(currentYear),
      }),
    });

    if (!response.ok) {
      throw new Error(`BLS API returned ${response.status}`);
    }

    const json = await response.json();

    if (json.status !== "REQUEST_SUCCEEDED") {
      throw new Error(`BLS API error: ${json.message?.join(", ") || "Unknown"}`);
    }

    const result: Record<string, { unemploymentRate: number }> = {};

    for (const series of json.Results?.series || []) {
      // Extract FIPS from series ID: LASST{FIPS}0000000000003
      const fips = series.seriesID.substring(5, 7);
      const abbr = FIPS_TO_ABBR[fips];
      if (!abbr) continue;

      // Get most recent data point
      const latestData = series.data?.[0];
      if (latestData?.value) {
        result[abbr] = {
          unemploymentRate: parseFloat(latestData.value),
        };
      }
    }

    // Only cache if we got meaningful data
    if (Object.keys(result).length > 10) {
      cache = { data: result, timestamp: Date.now() };
    }

    return NextResponse.json({
      data: result,
      source: "api",
      count: Object.keys(result).length,
    });
  } catch (error) {
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ data: cache.data, source: "stale-cache" });
    }

    return NextResponse.json(
      { error: "Failed to fetch BLS data", detail: String(error) },
      { status: 502 }
    );
  }
}
