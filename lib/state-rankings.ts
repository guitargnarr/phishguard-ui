import type { StateMetrics } from "./overlay-data";

export interface StateRank {
  population: number;
  medianIncome: number;
  povertyRate: number;
  unemploymentRate: number;
  gig_pct: number;
}

/** Build a map from state abbreviation to 1-based rank in O(n) after sort. */
function rankMap(sorted: [string, StateMetrics][]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < sorted.length; i++) {
    map[sorted[i][0]] = i + 1;
  }
  return map;
}

/**
 * Compute national rank (1=best) for each metric across all states.
 * "Best" means: highest income/population/gig, lowest poverty/unemployment.
 */
export function computeStateRanks(
  metrics: Record<string, StateMetrics>
): Record<string, StateRank> {
  const entries = Object.entries(metrics);

  // Sort each metric and build rank lookup maps (O(n) per metric after sort)
  const popRank = rankMap([...entries].sort((a, b) => b[1].population - a[1].population));
  const incomeRank = rankMap([...entries].sort((a, b) => b[1].medianIncome - a[1].medianIncome));
  const povertyRank = rankMap([...entries].sort((a, b) => a[1].povertyRate - b[1].povertyRate));
  const unempRank = rankMap([...entries].sort((a, b) => a[1].unemploymentRate - b[1].unemploymentRate));
  const gigRank = rankMap([...entries].sort((a, b) => b[1].gig_pct - a[1].gig_pct));

  const ranks: Record<string, StateRank> = {};

  for (const [abbr] of entries) {
    ranks[abbr] = {
      population: popRank[abbr],
      medianIncome: incomeRank[abbr],
      povertyRate: povertyRank[abbr],
      unemploymentRate: unempRank[abbr],
      gig_pct: gigRank[abbr],
    };
  }

  return ranks;
}
