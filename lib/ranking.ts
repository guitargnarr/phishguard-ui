import type { StateMetrics } from "./overlay-data";
import { FALLBACK_STATE_METRICS, AVG_ANNUAL_GLP1_LOSS } from "./overlay-data";

export interface RankingWeights {
  pharmacyCount: number;
  activeRate: number;
  density: number;
  revenuePotential: number;
  dataQuality: number;
}

export interface RankedState {
  abbr: string;
  score: number;
  rank: number;
  metrics: StateMetrics;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  pharmacyCount: 50,
  activeRate: 50,
  density: 50,
  revenuePotential: 50,
  dataQuality: 50,
};

export const PRESETS: Record<string, { label: string; description: string; weights: RankingWeights }> = {
  volume: {
    label: "Largest Markets",
    description: "Most independent pharmacies to contact",
    weights: { pharmacyCount: 100, activeRate: 40, density: 20, revenuePotential: 60, dataQuality: 30 },
  },
  viability: {
    label: "Highest Active Rate",
    description: "Most verified-active pharmacies",
    weights: { pharmacyCount: 30, activeRate: 100, density: 40, revenuePotential: 50, dataQuality: 80 },
  },
  glp1: {
    label: "GLP-1 Opportunity",
    description: "High volume + high active rate = routing potential",
    weights: { pharmacyCount: 60, activeRate: 50, density: 30, revenuePotential: 100, dataQuality: 40 },
  },
  clean: {
    label: "Cleanest Data",
    description: "Fewest uncertain records, most actionable leads",
    weights: { pharmacyCount: 40, activeRate: 70, density: 50, revenuePotential: 40, dataQuality: 100 },
  },
};

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(value, max) / max;
}

// Pharmacy-specific metric extractors
function getPharmacyCount(m: StateMetrics): number {
  return m.pharmacy?.independentCount ?? 0;
}

function getActiveRate(m: StateMetrics): number {
  const p = m.pharmacy;
  if (!p || p.independentCount === 0) return 0;
  return (p.active + p.likelyActive) / p.independentCount;
}

function getDensityPer100K(m: StateMetrics): number {
  const p = m.pharmacy;
  if (!p || m.population === 0) return 0;
  return (p.independentCount / m.population) * 100_000;
}

function getRevenuePotential(m: StateMetrics): number {
  const p = m.pharmacy;
  if (!p) return 0;
  return (p.active + p.likelyActive) * AVG_ANNUAL_GLP1_LOSS;
}

function getDataQuality(m: StateMetrics): number {
  const p = m.pharmacy;
  if (!p || p.independentCount === 0) return 0;
  return 1 - (p.uncertain + p.likelyClosed) / p.independentCount;
}

// Derive max values from real data so no state gets clamped at ceiling
const MAX_PHARMACY_COUNT = Math.max(
  ...Object.values(FALLBACK_STATE_METRICS).map(getPharmacyCount)
);
const MAX_ACTIVE_RATE = Math.max(
  ...Object.values(FALLBACK_STATE_METRICS).map(getActiveRate)
);
const MAX_DENSITY = Math.max(
  ...Object.values(FALLBACK_STATE_METRICS).map(getDensityPer100K)
);
const MAX_REVENUE = Math.max(
  ...Object.values(FALLBACK_STATE_METRICS).map(getRevenuePotential)
);

export function computeRankings(
  metrics: Record<string, StateMetrics>,
  weights: RankingWeights
): RankedState[] {
  const totalWeight =
    weights.pharmacyCount +
    weights.activeRate +
    weights.density +
    weights.revenuePotential +
    weights.dataQuality;

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
      (weights.pharmacyCount / totalWeight) *
        normalize(getPharmacyCount(m), MAX_PHARMACY_COUNT) +
      (weights.activeRate / totalWeight) *
        normalize(getActiveRate(m), MAX_ACTIVE_RATE) +
      (weights.density / totalWeight) *
        normalize(getDensityPer100K(m), MAX_DENSITY) +
      (weights.revenuePotential / totalWeight) *
        normalize(getRevenuePotential(m), MAX_REVENUE) +
      (weights.dataQuality / totalWeight) *
        normalize(getDataQuality(m), 1);

    return { abbr, score, rank: 0, metrics: m };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scored;
}

export function weightsToParams(weights: RankingWeights): string {
  return `${weights.pharmacyCount},${weights.activeRate},${weights.density},${weights.revenuePotential},${weights.dataQuality}`;
}

export function paramsToWeights(param: string): RankingWeights | null {
  const parts = param.split(",").map(Number);
  if (parts.length !== 5 || parts.some(isNaN)) return null;
  return {
    pharmacyCount: Math.max(0, Math.min(100, parts[0])),
    activeRate: Math.max(0, Math.min(100, parts[1])),
    density: Math.max(0, Math.min(100, parts[2])),
    revenuePotential: Math.max(0, Math.min(100, parts[3])),
    dataQuality: Math.max(0, Math.min(100, parts[4])),
  };
}
