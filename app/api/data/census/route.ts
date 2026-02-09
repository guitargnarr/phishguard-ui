import { NextResponse } from "next/server";

// Census Bureau ACS 5-Year Estimates API
// Variables: B01003_001E (population), B19013_001E (median income), B17001_002E (poverty count)
// Public access without API key (lower rate limits, but sufficient with 24h cache)

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

interface CensusCache {
  data: Record<string, { population: number; medianIncome: number; povertyRate: number }>;
  timestamp: number;
}

let cache: CensusCache | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cache.data, source: "cache" });
  }

  try {
    // ACS 5-Year data for all states
    // B01003_001E = Total population
    // B19013_001E = Median household income
    // B17001_002E = Income below poverty level (count)
    const variables = "B01003_001E,B19013_001E,B17001_002E";
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variables}&for=state:*`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Census API returned ${response.status}`);
    }

    const json: string[][] = await response.json();

    // First row is headers: [NAME, B01003_001E, B19013_001E, B17001_002E, state]
    const headers = json[0];
    const popIdx = headers.indexOf("B01003_001E");
    const incIdx = headers.indexOf("B19013_001E");
    const povIdx = headers.indexOf("B17001_002E");
    const fipsIdx = headers.indexOf("state");

    const result: Record<string, { population: number; medianIncome: number; povertyRate: number }> = {};

    for (let i = 1; i < json.length; i++) {
      const row = json[i];
      const fips = row[fipsIdx]?.padStart(2, "0");
      const abbr = FIPS_TO_ABBR[fips];
      if (!abbr) continue;

      const population = parseInt(row[popIdx], 10);
      const medianIncome = parseInt(row[incIdx], 10);
      const povertyCount = parseInt(row[povIdx], 10);

      if (isNaN(population) || isNaN(medianIncome) || isNaN(povertyCount)) continue;
      if (population <= 0) continue;

      const povertyRate = Math.round((povertyCount / population) * 1000) / 10; // One decimal

      result[abbr] = { population, medianIncome, povertyRate };
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
      { error: "Failed to fetch Census data", detail: String(error) },
      { status: 502 }
    );
  }
}
