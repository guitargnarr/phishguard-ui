import type { StateMetrics } from "./overlay-data";
import { FALLBACK_STATE_METRICS } from "./overlay-data";

interface BLSResponse {
  data: Record<string, { unemploymentRate: number }>;
  source: string;
}

interface CensusResponse {
  data: Record<string, { population: number; medianIncome: number; povertyRate: number }>;
  source: string;
}

export interface LiveMetricsResult {
  metrics: Record<string, StateMetrics>;
  isLive: boolean;
}

let clientCache: LiveMetricsResult | null = null;
let fetchPromise: Promise<LiveMetricsResult> | null = null;

async function doFetch(): Promise<LiveMetricsResult> {
  try {
    const [blsRes, censusRes] = await Promise.allSettled([
      fetch("/api/data/bls").then((r) => r.ok ? r.json() as Promise<BLSResponse> : null),
      fetch("/api/data/census").then((r) => r.ok ? r.json() as Promise<CensusResponse> : null),
    ]);

    const blsData = blsRes.status === "fulfilled" ? blsRes.value?.data : null;
    const censusData = censusRes.status === "fulfilled" ? censusRes.value?.data : null;

    // If both APIs failed, fall back entirely
    if (!blsData && !censusData) {
      return { metrics: FALLBACK_STATE_METRICS, isLive: false };
    }

    // Merge live data onto fallback (preserves gig_pct, legislation, etc.)
    const merged: Record<string, StateMetrics> = {};

    for (const [abbr, fallback] of Object.entries(FALLBACK_STATE_METRICS)) {
      const census = censusData?.[abbr];
      const bls = blsData?.[abbr];

      merged[abbr] = {
        ...fallback,
        // Override with live data when available
        ...(census && {
          population: census.population,
          medianIncome: census.medianIncome,
          povertyRate: census.povertyRate,
        }),
        ...(bls && {
          unemploymentRate: bls.unemploymentRate,
        }),
        // gig_pct, hasActiveLegislation, legislationTopics always from fallback
      };
    }

    return { metrics: merged, isLive: true };
  } catch {
    return { metrics: FALLBACK_STATE_METRICS, isLive: false };
  }
}

/**
 * Fetch live state metrics from BLS + Census APIs.
 * Returns cached data immediately if available, triggers background refresh.
 * Falls back to hardcoded FALLBACK_STATE_METRICS on any error.
 */
export async function fetchLiveMetrics(): Promise<LiveMetricsResult> {
  // Return client cache immediately
  if (clientCache) {
    // Background refresh (fire and forget)
    if (!fetchPromise) {
      fetchPromise = doFetch().then((result) => {
        clientCache = result;
        fetchPromise = null;
        return result;
      });
    }
    return clientCache;
  }

  // First call: wait for data
  if (!fetchPromise) {
    fetchPromise = doFetch().then((result) => {
      clientCache = result;
      fetchPromise = null;
      return result;
    });
  }

  return fetchPromise;
}
