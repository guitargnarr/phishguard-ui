// ── Overlay Layer Types & Data ───────────────────────────────────────────

export type OverlayId =
  | "highways"
  | "population"
  | "socioeconomic"
  | "employment"
  | "legislation";

export interface OverlayConfig {
  id: OverlayId;
  label: string;
  color: string;
  description: string;
}

export interface StateMetrics {
  population: number;
  medianIncome: number;
  povertyRate: number;
  unemploymentRate: number;
  gig_pct: number;
  hasActiveLegislation: boolean;
  legislationTopics: string[];
}

export const OVERLAY_CONFIGS: OverlayConfig[] = [
  {
    id: "highways",
    label: "Highways",
    color: "#e0e0e0",
    description: "Major interstate routes",
  },
  {
    id: "population",
    label: "Population",
    color: "#3b82f6",
    description: "State population density",
  },
  {
    id: "socioeconomic",
    label: "Socioeconomic",
    color: "#eab308",
    description: "Poverty rate & median income",
  },
  {
    id: "employment",
    label: "Employment",
    color: "#22c55e",
    description: "Unemployment & gig workforce",
  },
  {
    id: "legislation",
    label: "Legislation",
    color: "#ef4444",
    description: "Active data privacy & AI legislation",
  },
];

// Approximate 2024 Census/BLS data for all 50 states + DC
export const STATE_METRICS: Record<string, StateMetrics> = {
  AL: { population: 5108468, medianIncome: 56929, povertyRate: 14.8, unemploymentRate: 2.8, gig_pct: 6.2, hasActiveLegislation: false, legislationTopics: [] },
  AK: { population: 733406, medianIncome: 77790, povertyRate: 10.2, unemploymentRate: 4.4, gig_pct: 8.1, hasActiveLegislation: false, legislationTopics: [] },
  AZ: { population: 7431344, medianIncome: 65913, povertyRate: 13.5, unemploymentRate: 3.5, gig_pct: 9.8, hasActiveLegislation: false, legislationTopics: [] },
  AR: { population: 3067732, medianIncome: 52528, povertyRate: 15.7, unemploymentRate: 3.4, gig_pct: 5.4, hasActiveLegislation: false, legislationTopics: [] },
  CA: { population: 38965193, medianIncome: 84907, povertyRate: 11.0, unemploymentRate: 4.8, gig_pct: 13.2, hasActiveLegislation: true, legislationTopics: ["CCPA/CPRA Data Privacy", "AI Transparency", "Gig Worker Rights"] },
  CO: { population: 5877610, medianIncome: 82254, povertyRate: 9.1, unemploymentRate: 3.3, gig_pct: 10.5, hasActiveLegislation: true, legislationTopics: ["Colorado Privacy Act", "AI Governance"] },
  CT: { population: 3617176, medianIncome: 83771, povertyRate: 9.8, unemploymentRate: 3.8, gig_pct: 7.9, hasActiveLegislation: true, legislationTopics: ["CT Data Privacy Act"] },
  DE: { population: 1018396, medianIncome: 72724, povertyRate: 11.3, unemploymentRate: 3.9, gig_pct: 7.1, hasActiveLegislation: false, legislationTopics: [] },
  FL: { population: 22610726, medianIncome: 63062, povertyRate: 11.4, unemploymentRate: 3.0, gig_pct: 11.3, hasActiveLegislation: false, legislationTopics: [] },
  GA: { population: 11029227, medianIncome: 65030, povertyRate: 12.0, unemploymentRate: 3.2, gig_pct: 8.5, hasActiveLegislation: false, legislationTopics: [] },
  HI: { population: 1435138, medianIncome: 84857, povertyRate: 9.3, unemploymentRate: 3.0, gig_pct: 8.7, hasActiveLegislation: false, legislationTopics: [] },
  ID: { population: 1964726, medianIncome: 64930, povertyRate: 10.9, unemploymentRate: 2.9, gig_pct: 7.3, hasActiveLegislation: false, legislationTopics: [] },
  IL: { population: 12549689, medianIncome: 72205, povertyRate: 10.5, unemploymentRate: 4.3, gig_pct: 8.8, hasActiveLegislation: true, legislationTopics: ["IL Biometric Privacy (BIPA)", "AI Video Interview Act"] },
  IN: { population: 6862199, medianIncome: 61944, povertyRate: 11.4, unemploymentRate: 3.3, gig_pct: 6.7, hasActiveLegislation: false, legislationTopics: [] },
  IA: { population: 3207004, medianIncome: 65573, povertyRate: 10.4, unemploymentRate: 2.7, gig_pct: 5.8, hasActiveLegislation: false, legislationTopics: [] },
  KS: { population: 2940546, medianIncome: 64521, povertyRate: 10.3, unemploymentRate: 2.8, gig_pct: 6.4, hasActiveLegislation: false, legislationTopics: [] },
  KY: { population: 4526154, medianIncome: 55573, povertyRate: 15.5, unemploymentRate: 3.9, gig_pct: 6.0, hasActiveLegislation: false, legislationTopics: [] },
  LA: { population: 4573749, medianIncome: 52087, povertyRate: 18.6, unemploymentRate: 3.5, gig_pct: 6.8, hasActiveLegislation: false, legislationTopics: [] },
  ME: { population: 1395722, medianIncome: 64767, povertyRate: 10.9, unemploymentRate: 3.0, gig_pct: 8.2, hasActiveLegislation: false, legislationTopics: [] },
  MD: { population: 6177224, medianIncome: 87063, povertyRate: 9.1, unemploymentRate: 2.8, gig_pct: 8.4, hasActiveLegislation: false, legislationTopics: [] },
  MA: { population: 7001399, medianIncome: 89645, povertyRate: 10.0, unemploymentRate: 3.5, gig_pct: 9.1, hasActiveLegislation: true, legislationTopics: ["MA Data Privacy Proposed"] },
  MI: { population: 10037261, medianIncome: 63202, povertyRate: 13.0, unemploymentRate: 3.9, gig_pct: 7.4, hasActiveLegislation: false, legislationTopics: [] },
  MN: { population: 5737915, medianIncome: 77706, povertyRate: 8.3, unemploymentRate: 2.6, gig_pct: 7.9, hasActiveLegislation: true, legislationTopics: ["MN Consumer Data Privacy Act"] },
  MS: { population: 2939690, medianIncome: 48610, povertyRate: 18.7, unemploymentRate: 3.7, gig_pct: 5.1, hasActiveLegislation: false, legislationTopics: [] },
  MO: { population: 6196156, medianIncome: 60905, povertyRate: 12.1, unemploymentRate: 2.8, gig_pct: 6.9, hasActiveLegislation: false, legislationTopics: [] },
  MT: { population: 1132812, medianIncome: 60560, povertyRate: 12.1, unemploymentRate: 2.5, gig_pct: 9.4, hasActiveLegislation: true, legislationTopics: ["MT Consumer Data Privacy Act"] },
  NE: { population: 1978379, medianIncome: 66644, povertyRate: 10.0, unemploymentRate: 2.1, gig_pct: 6.1, hasActiveLegislation: false, legislationTopics: [] },
  NV: { population: 3194176, medianIncome: 63276, povertyRate: 11.2, unemploymentRate: 5.2, gig_pct: 11.7, hasActiveLegislation: false, legislationTopics: [] },
  NH: { population: 1402054, medianIncome: 83449, povertyRate: 7.2, unemploymentRate: 2.1, gig_pct: 8.0, hasActiveLegislation: true, legislationTopics: ["NH Data Privacy Proposed"] },
  NJ: { population: 9290841, medianIncome: 85245, povertyRate: 9.4, unemploymentRate: 4.0, gig_pct: 8.6, hasActiveLegislation: true, legislationTopics: ["NJ Data Privacy Proposed"] },
  NM: { population: 2117522, medianIncome: 53992, povertyRate: 17.6, unemploymentRate: 3.8, gig_pct: 7.5, hasActiveLegislation: false, legislationTopics: [] },
  NY: { population: 19571216, medianIncome: 74314, povertyRate: 12.7, unemploymentRate: 4.0, gig_pct: 10.3, hasActiveLegislation: true, legislationTopics: ["NY SHIELD Act", "AI Hiring Law (NYC)"] },
  NC: { population: 10835491, medianIncome: 61972, povertyRate: 12.9, unemploymentRate: 3.4, gig_pct: 8.0, hasActiveLegislation: false, legislationTopics: [] },
  ND: { population: 783926, medianIncome: 64577, povertyRate: 10.8, unemploymentRate: 2.0, gig_pct: 5.7, hasActiveLegislation: false, legislationTopics: [] },
  OH: { population: 11780017, medianIncome: 59855, povertyRate: 13.0, unemploymentRate: 3.6, gig_pct: 7.0, hasActiveLegislation: false, legislationTopics: [] },
  OK: { population: 4019800, medianIncome: 55826, povertyRate: 14.5, unemploymentRate: 3.0, gig_pct: 6.3, hasActiveLegislation: false, legislationTopics: [] },
  OR: { population: 4233358, medianIncome: 70084, povertyRate: 11.2, unemploymentRate: 3.7, gig_pct: 10.1, hasActiveLegislation: true, legislationTopics: ["OR Consumer Privacy Act"] },
  PA: { population: 12961683, medianIncome: 67587, povertyRate: 11.1, unemploymentRate: 3.4, gig_pct: 7.5, hasActiveLegislation: false, legislationTopics: [] },
  RI: { population: 1095962, medianIncome: 71169, povertyRate: 10.3, unemploymentRate: 3.2, gig_pct: 7.8, hasActiveLegislation: false, legislationTopics: [] },
  SC: { population: 5373555, medianIncome: 56227, povertyRate: 13.8, unemploymentRate: 3.1, gig_pct: 7.2, hasActiveLegislation: false, legislationTopics: [] },
  SD: { population: 919318, medianIncome: 63920, povertyRate: 12.5, unemploymentRate: 2.0, gig_pct: 6.0, hasActiveLegislation: false, legislationTopics: [] },
  TN: { population: 7126489, medianIncome: 59695, povertyRate: 12.8, unemploymentRate: 3.2, gig_pct: 7.6, hasActiveLegislation: true, legislationTopics: ["TN Information Protection Act"] },
  TX: { population: 30503301, medianIncome: 67321, povertyRate: 13.4, unemploymentRate: 3.9, gig_pct: 10.2, hasActiveLegislation: true, legislationTopics: ["TX Data Privacy and Security Act"] },
  UT: { population: 3417734, medianIncome: 74197, povertyRate: 8.2, unemploymentRate: 2.6, gig_pct: 8.9, hasActiveLegislation: true, legislationTopics: ["UT Consumer Privacy Act"] },
  VT: { population: 647464, medianIncome: 65792, povertyRate: 10.3, unemploymentRate: 2.1, gig_pct: 9.3, hasActiveLegislation: false, legislationTopics: [] },
  VA: { population: 8642274, medianIncome: 80963, povertyRate: 9.6, unemploymentRate: 2.7, gig_pct: 9.0, hasActiveLegislation: true, legislationTopics: ["VA Consumer Data Protection Act"] },
  WA: { population: 7812880, medianIncome: 82228, povertyRate: 10.0, unemploymentRate: 3.8, gig_pct: 11.0, hasActiveLegislation: true, legislationTopics: ["WA My Health My Data Act", "AI Task Force"] },
  WV: { population: 1770071, medianIncome: 48037, povertyRate: 17.1, unemploymentRate: 4.0, gig_pct: 4.9, hasActiveLegislation: false, legislationTopics: [] },
  WI: { population: 5910955, medianIncome: 66930, povertyRate: 10.6, unemploymentRate: 2.8, gig_pct: 6.5, hasActiveLegislation: false, legislationTopics: [] },
  WY: { population: 584057, medianIncome: 65003, povertyRate: 9.6, unemploymentRate: 2.8, gig_pct: 7.7, hasActiveLegislation: false, legislationTopics: [] },
  DC: { population: 678972, medianIncome: 101722, povertyRate: 13.2, unemploymentRate: 4.5, gig_pct: 12.4, hasActiveLegislation: true, legislationTopics: ["DC Stop Discrimination by Algorithms Act"] },
};

// Helper: format population for display
export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return String(pop);
}

// Helper: format currency
export function formatIncome(income: number): string {
  return `$${(income / 1_000).toFixed(0)}K`;
}
