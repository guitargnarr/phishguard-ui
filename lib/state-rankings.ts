import type { StateMetrics } from "./overlay-data";
import { AVG_ANNUAL_GLP1_LOSS } from "./overlay-data";

export interface StateRank {
  pharmacyCount: number;
  activeRate: number;
  density: number;
  revenuePotential: number;
  contactable: number;
  population: number;
}

/** Build a map from state abbreviation to 1-based rank in O(n) after sort. */
function rankMap(sorted: [string, number][]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < sorted.length; i++) {
    map[sorted[i][0]] = i + 1;
  }
  return map;
}

/**
 * Compute national rank (1=best) for each pharmacy metric across all states.
 * "Best" means highest for all metrics.
 */
export function computeStateRanks(
  metrics: Record<string, StateMetrics>
): Record<string, StateRank> {
  const entries = Object.entries(metrics);

  // Compute derived values per state
  const derived = entries.map(([abbr, m]) => {
    const p = m.pharmacy;
    const count = p?.independentCount ?? 0;
    const contactable = (p?.active ?? 0) + (p?.likelyActive ?? 0);
    const activeRate = count > 0 ? contactable / count : 0;
    const densityPer100K = m.population > 0 ? (count / m.population) * 100_000 : 0;
    const revenue = contactable * AVG_ANNUAL_GLP1_LOSS;
    return { abbr, count, contactable, activeRate, densityPer100K, revenue, population: m.population };
  });

  // Sort and rank each metric (descending = higher is better)
  const countRank = rankMap([...derived].sort((a, b) => b.count - a.count).map(d => [d.abbr, d.count]));
  const activeRateRank = rankMap([...derived].sort((a, b) => b.activeRate - a.activeRate).map(d => [d.abbr, d.activeRate]));
  const densityRank = rankMap([...derived].sort((a, b) => b.densityPer100K - a.densityPer100K).map(d => [d.abbr, d.densityPer100K]));
  const revenueRank = rankMap([...derived].sort((a, b) => b.revenue - a.revenue).map(d => [d.abbr, d.revenue]));
  const contactableRank = rankMap([...derived].sort((a, b) => b.contactable - a.contactable).map(d => [d.abbr, d.contactable]));
  const popRank = rankMap([...derived].sort((a, b) => b.population - a.population).map(d => [d.abbr, d.population]));

  const ranks: Record<string, StateRank> = {};
  for (const { abbr } of derived) {
    ranks[abbr] = {
      pharmacyCount: countRank[abbr],
      activeRate: activeRateRank[abbr],
      density: densityRank[abbr],
      revenuePotential: revenueRank[abbr],
      contactable: contactableRank[abbr],
      population: popRank[abbr],
    };
  }

  return ranks;
}
