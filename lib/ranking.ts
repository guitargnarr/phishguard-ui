import type { StateMetrics } from "./overlay-data";
import { METRIC_MAXES, FALLBACK_STATE_METRICS } from "./overlay-data";

export interface RankingWeights {
  lowUnemployment: number;
  highIncome: number;
  lowPoverty: number;
  lowCost: number;
  gigEconomy: number;
}

export interface RankedState {
  abbr: string;
  score: number;
  rank: number;
  metrics: StateMetrics;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  lowUnemployment: 50,
  highIncome: 50,
  lowPoverty: 50,
  lowCost: 50,
  gigEconomy: 50,
};

export const PRESETS: Record<string, { label: string; weights: RankingWeights }> = {
  remote: {
    label: "Remote Worker",
    weights: { lowUnemployment: 30, highIncome: 90, lowPoverty: 40, lowCost: 80, gigEconomy: 70 },
  },
  startup: {
    label: "Startup Founder",
    weights: { lowUnemployment: 20, highIncome: 60, lowPoverty: 50, lowCost: 40, gigEconomy: 90 },
  },
  privacy: {
    label: "Privacy Advocate",
    weights: { lowUnemployment: 40, highIncome: 50, lowPoverty: 50, lowCost: 50, gigEconomy: 30 },
  },
  affordable: {
    label: "Affordable Living",
    weights: { lowUnemployment: 60, highIncome: 30, lowPoverty: 70, lowCost: 100, gigEconomy: 20 },
  },
};

function normalize(value: number, max: number, inverted: boolean): number {
  const clamped = Math.min(value, max) / max;
  return inverted ? 1 - clamped : clamped;
}

// Cost index: poverty-to-income ratio. High poverty + low income = expensive to
// live in relative to earnings. This is independent of the raw income metric so
// the "High Income" and "Low Cost" sliders measure different things.
function costIndex(m: StateMetrics): number {
  if (m.medianIncome === 0) return 1;
  return (m.povertyRate / 100) / (m.medianIncome / METRIC_MAXES.medianIncome);
}

// Derive max from real data so no state gets clamped at the ceiling.
const COST_INDEX_MAX = Math.max(
  ...Object.values(FALLBACK_STATE_METRICS).map(costIndex)
);

export function computeRankings(
  metrics: Record<string, StateMetrics>,
  weights: RankingWeights
): RankedState[] {
  const totalWeight =
    weights.lowUnemployment +
    weights.highIncome +
    weights.lowPoverty +
    weights.lowCost +
    weights.gigEconomy;

  if (totalWeight === 0) {
    return Object.entries(metrics).map(([abbr, m], i) => ({
      abbr,
      score: 0,
      rank: i + 1,
      metrics: m,
    }));
  }

  const scored = Object.entries(metrics).map(([abbr, m]) => {
    const score =
      (weights.lowUnemployment / totalWeight) *
        normalize(m.unemploymentRate, METRIC_MAXES.unemploymentRate, true) +
      (weights.highIncome / totalWeight) *
        normalize(m.medianIncome, METRIC_MAXES.medianIncome, false) +
      (weights.lowPoverty / totalWeight) *
        normalize(m.povertyRate, METRIC_MAXES.povertyRate, true) +
      (weights.lowCost / totalWeight) *
        normalize(costIndex(m), COST_INDEX_MAX, true) +
      (weights.gigEconomy / totalWeight) *
        normalize(m.gig_pct, METRIC_MAXES.gig_pct, false);

    return { abbr, score, rank: 0, metrics: m };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scored;
}

export function weightsToParams(weights: RankingWeights): string {
  return `${weights.lowUnemployment},${weights.highIncome},${weights.lowPoverty},${weights.lowCost},${weights.gigEconomy}`;
}

export function paramsToWeights(param: string): RankingWeights | null {
  const parts = param.split(",").map(Number);
  if (parts.length !== 5 || parts.some(isNaN)) return null;
  return {
    lowUnemployment: Math.max(0, Math.min(100, parts[0])),
    highIncome: Math.max(0, Math.min(100, parts[1])),
    lowPoverty: Math.max(0, Math.min(100, parts[2])),
    lowCost: Math.max(0, Math.min(100, parts[3])),
    gigEconomy: Math.max(0, Math.min(100, parts[4])),
  };
}
