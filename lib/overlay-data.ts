// ── Overlay Layer Types & Data ───────────────────────────────────────────

export type OverlayId = "viability" | "density" | "active-count";

export interface OverlayLegend {
  type: "gradient" | "binary";
  minLabel: string;
  maxLabel: string;
  stops: string[];
}

export interface OverlayConfig {
  id: OverlayId;
  label: string;
  color: string;
  description: string;
  legend?: OverlayLegend;
}

export interface PharmacyMetrics {
  independentCount: number;
  active: number;
  likelyActive: number;
  uncertain: number;
  likelyClosed: number;
}

export interface StateMetrics {
  population: number;
  medianIncome: number;
  povertyRate: number;
  unemploymentRate: number;
  gig_pct: number;
  hasActiveLegislation: boolean;
  legislationTopics: string[];
  pharmacy?: PharmacyMetrics;
}

export const OVERLAY_CONFIGS: OverlayConfig[] = [
  {
    id: "viability",
    label: "Viability",
    color: "#22c55e",
    description: "Pharmacy viability ratio by state",
    legend: {
      type: "gradient",
      minLabel: "Low",
      maxLabel: "High",
      stops: ["#ef4444", "#eab308", "#84cc16", "#16a34a"],
    },
  },
  {
    id: "density",
    label: "Density",
    color: "#a855f7",
    description: "Independent pharmacy count by state",
    legend: {
      type: "gradient",
      minLabel: "Low",
      maxLabel: "4,800+",
      stops: ["#2e1065", "#7c3aed", "#a855f7", "#d8b4fe"],
    },
  },
  {
    id: "active-count",
    label: "Active Count",
    color: "#3b82f6",
    description: "Active-status pharmacies by state",
    legend: {
      type: "gradient",
      minLabel: "Low",
      maxLabel: "1,300+",
      stops: ["#1e3a5f", "#3b82f6", "#60a5fa", "#93c5fd"],
    },
  },
];

// Approximate 2024 Census/BLS data for all 50 states + DC
// Legislation data CORRECTED Feb 8 2026 against .gov sources:
//   ncsl.org, mgaleg.maryland.gov, ftc.gov, fincen.gov, congress.gov, mintz.com/consumer-privacy-law
// 20 states have enacted COMPREHENSIVE consumer data privacy laws (through 2024):
//   CA, CO, CT, DE, FL, IA, IN, KY, MD, MN, MT, NE, NH, NJ, OR, RI, TN, TX, UT, VA
// States with SECTORAL-ONLY laws (NOT comprehensive): IL (BIPA biometric), NY (SHIELD breach notif),
//   MA (breach notification + student data), WA (My Health My Data health-only)
// hasActiveLegislation=true means COMPREHENSIVE consumer data privacy law enacted
// legislationTopics lists ALL relevant privacy laws including sectoral
export const FALLBACK_STATE_METRICS: Record<string, StateMetrics> = {
  AL: { population: 5108468, medianIncome: 56929, povertyRate: 14.8, unemploymentRate: 2.8, gig_pct: 6.2, hasActiveLegislation: false, legislationTopics: [], pharmacy: { independentCount: 911, active: 196, likelyActive: 255, uncertain: 227, likelyClosed: 233 } },
  AK: { population: 733406, medianIncome: 77790, povertyRate: 10.2, unemploymentRate: 4.4, gig_pct: 8.1, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 49, active: 13, likelyActive: 11, uncertain: 15, likelyClosed: 10 } },
  AZ: { population: 7431344, medianIncome: 65913, povertyRate: 13.5, unemploymentRate: 3.5, gig_pct: 9.8, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 357, active: 91, likelyActive: 93, uncertain: 88, likelyClosed: 85 } },
  AR: { population: 3067732, medianIncome: 52528, povertyRate: 15.7, unemploymentRate: 3.4, gig_pct: 5.4, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 629, active: 160, likelyActive: 211, uncertain: 127, likelyClosed: 131 } },
  CA: { population: 38965193, medianIncome: 84907, povertyRate: 11.0, unemploymentRate: 4.8, gig_pct: 13.2, hasActiveLegislation: true, legislationTopics: ["CCPA/CPRA Data Privacy", "AI Transparency", "Gig Worker Rights"] , pharmacy: { independentCount: 3827, active: 977, likelyActive: 1128, uncertain: 935, likelyClosed: 787 } },
  CO: { population: 5877610, medianIncome: 82254, povertyRate: 9.1, unemploymentRate: 3.3, gig_pct: 10.5, hasActiveLegislation: true, legislationTopics: ["CO Privacy Act (CPA, eff. Jul 2023)", "AI Governance"] , pharmacy: { independentCount: 291, active: 64, likelyActive: 108, uncertain: 54, likelyClosed: 65 } },
  CT: { population: 3617176, medianIncome: 83771, povertyRate: 9.8, unemploymentRate: 3.8, gig_pct: 7.9, hasActiveLegislation: true, legislationTopics: ["CT Data Privacy Act (CTDPA, eff. Jul 2023)"] , pharmacy: { independentCount: 359, active: 110, likelyActive: 93, uncertain: 88, likelyClosed: 68 } },
  DE: { population: 1018396, medianIncome: 72724, povertyRate: 11.3, unemploymentRate: 3.9, gig_pct: 7.1, hasActiveLegislation: true, legislationTopics: ["DE Personal Data Privacy Act (H 154, eff. Jan 2025)"] , pharmacy: { independentCount: 80, active: 36, likelyActive: 14, uncertain: 17, likelyClosed: 13 } },
  FL: { population: 22610726, medianIncome: 63062, povertyRate: 11.4, unemploymentRate: 3.0, gig_pct: 11.3, hasActiveLegislation: true, legislationTopics: ["FL Digital Bill of Rights (SB 262, eff. Jul 2024)"] , pharmacy: { independentCount: 3442, active: 676, likelyActive: 853, uncertain: 801, likelyClosed: 1112 } },
  GA: { population: 11029227, medianIncome: 65030, povertyRate: 12.0, unemploymentRate: 3.2, gig_pct: 8.5, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 1204, active: 305, likelyActive: 336, uncertain: 278, likelyClosed: 285 } },
  HI: { population: 1435138, medianIncome: 84857, povertyRate: 9.3, unemploymentRate: 3.0, gig_pct: 8.7, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 137, active: 31, likelyActive: 39, uncertain: 34, likelyClosed: 33 } },
  ID: { population: 1964726, medianIncome: 64930, povertyRate: 10.9, unemploymentRate: 2.9, gig_pct: 7.3, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 240, active: 85, likelyActive: 66, uncertain: 55, likelyClosed: 34 } },
  IL: { population: 12549689, medianIncome: 72205, povertyRate: 10.5, unemploymentRate: 4.3, gig_pct: 8.8, hasActiveLegislation: false, legislationTopics: ["IL Biometric Privacy (BIPA, sectoral only)", "AI Video Interview Act"] , pharmacy: { independentCount: 1086, active: 207, likelyActive: 299, uncertain: 291, likelyClosed: 289 } },
  IN: { population: 6862199, medianIncome: 61944, povertyRate: 11.4, unemploymentRate: 3.3, gig_pct: 6.7, hasActiveLegislation: true, legislationTopics: ["IN Consumer Data Protection Act (IC 24-15, eff. Jan 2026)"] , pharmacy: { independentCount: 358, active: 110, likelyActive: 112, uncertain: 64, likelyClosed: 72 } },
  IA: { population: 3207004, medianIncome: 65573, povertyRate: 10.4, unemploymentRate: 2.7, gig_pct: 5.8, hasActiveLegislation: true, legislationTopics: ["IA Consumer Data Protection Act (SF 262, eff. Jan 2025)"] , pharmacy: { independentCount: 430, active: 125, likelyActive: 138, uncertain: 76, likelyClosed: 91 } },
  KS: { population: 2940546, medianIncome: 64521, povertyRate: 10.3, unemploymentRate: 2.8, gig_pct: 6.4, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 442, active: 128, likelyActive: 141, uncertain: 109, likelyClosed: 64 } },
  KY: { population: 4526154, medianIncome: 55573, povertyRate: 15.5, unemploymentRate: 3.9, gig_pct: 6.0, hasActiveLegislation: true, legislationTopics: ["KY Consumer Data Protection Act (H 15, eff. Jan 2026)"] , pharmacy: { independentCount: 856, active: 220, likelyActive: 267, uncertain: 204, likelyClosed: 165 } },
  LA: { population: 4573749, medianIncome: 52087, povertyRate: 18.6, unemploymentRate: 3.5, gig_pct: 6.8, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 924, active: 283, likelyActive: 219, uncertain: 222, likelyClosed: 200 } },
  ME: { population: 1395722, medianIncome: 64767, povertyRate: 10.9, unemploymentRate: 3.0, gig_pct: 8.2, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 111, active: 34, likelyActive: 23, uncertain: 33, likelyClosed: 21 } },
  MD: { population: 6177224, medianIncome: 87063, povertyRate: 9.1, unemploymentRate: 2.8, gig_pct: 8.4, hasActiveLegislation: true, legislationTopics: ["MD Online Data Privacy Act (MODPA, eff. Oct 2025)"] , pharmacy: { independentCount: 649, active: 146, likelyActive: 164, uncertain: 186, likelyClosed: 153 } },
  MA: { population: 7001399, medianIncome: 89645, povertyRate: 10.0, unemploymentRate: 3.5, gig_pct: 9.1, hasActiveLegislation: false, legislationTopics: ["MA Data Privacy (sectoral only: breach notification, student data)"] , pharmacy: { independentCount: 401, active: 117, likelyActive: 106, uncertain: 81, likelyClosed: 97 } },
  MI: { population: 10037261, medianIncome: 63202, povertyRate: 13.0, unemploymentRate: 3.9, gig_pct: 7.4, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 2110, active: 444, likelyActive: 565, uncertain: 577, likelyClosed: 524 } },
  MN: { population: 5737915, medianIncome: 77706, povertyRate: 8.3, unemploymentRate: 2.6, gig_pct: 7.9, hasActiveLegislation: true, legislationTopics: ["MN Consumer Data Privacy Act (MNCDPA, eff. Jul 31 2025)"] , pharmacy: { independentCount: 505, active: 151, likelyActive: 97, uncertain: 106, likelyClosed: 151 } },
  MS: { population: 2939690, medianIncome: 48610, povertyRate: 18.7, unemploymentRate: 3.7, gig_pct: 5.1, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 643, active: 142, likelyActive: 175, uncertain: 194, likelyClosed: 132 } },
  MO: { population: 6196156, medianIncome: 60905, povertyRate: 12.1, unemploymentRate: 2.8, gig_pct: 6.9, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 847, active: 214, likelyActive: 239, uncertain: 198, likelyClosed: 196 } },
  MT: { population: 1132812, medianIncome: 60560, povertyRate: 12.1, unemploymentRate: 2.5, gig_pct: 9.4, hasActiveLegislation: true, legislationTopics: ["MT Consumer Data Privacy Act (MCDPA, eff. Oct 2024)"] , pharmacy: { independentCount: 215, active: 59, likelyActive: 87, uncertain: 33, likelyClosed: 36 } },
  NE: { population: 1978379, medianIncome: 66644, povertyRate: 10.0, unemploymentRate: 2.1, gig_pct: 6.1, hasActiveLegislation: true, legislationTopics: ["NE Data Privacy Act (NEDPA, eff. Jan 2025)"] , pharmacy: { independentCount: 321, active: 63, likelyActive: 92, uncertain: 85, likelyClosed: 81 } },
  NV: { population: 3194176, medianIncome: 63276, povertyRate: 11.2, unemploymentRate: 5.2, gig_pct: 11.7, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 246, active: 62, likelyActive: 71, uncertain: 57, likelyClosed: 56 } },
  NH: { population: 1402054, medianIncome: 83449, povertyRate: 7.2, unemploymentRate: 2.1, gig_pct: 8.0, hasActiveLegislation: true, legislationTopics: ["NH Privacy Act (SB 225, eff. Jan 2025)"] , pharmacy: { independentCount: 62, active: 13, likelyActive: 18, uncertain: 13, likelyClosed: 18 } },
  NJ: { population: 9290841, medianIncome: 85245, povertyRate: 9.4, unemploymentRate: 4.0, gig_pct: 8.6, hasActiveLegislation: true, legislationTopics: ["NJ Data Privacy Act (SB 332, eff. Jan 2025)"] , pharmacy: { independentCount: 1576, active: 420, likelyActive: 389, uncertain: 394, likelyClosed: 373 } },
  NM: { population: 2117522, medianIncome: 53992, povertyRate: 17.6, unemploymentRate: 3.8, gig_pct: 7.5, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 157, active: 38, likelyActive: 42, uncertain: 33, likelyClosed: 44 } },
  NY: { population: 19571216, medianIncome: 74314, povertyRate: 12.7, unemploymentRate: 4.0, gig_pct: 10.3, hasActiveLegislation: false, legislationTopics: ["NY SHIELD Act (breach notif only, not comprehensive)", "AI Hiring Law (NYC, local)"] , pharmacy: { independentCount: 4819, active: 1318, likelyActive: 1291, uncertain: 1196, likelyClosed: 1014 } },
  NC: { population: 10835491, medianIncome: 61972, povertyRate: 12.9, unemploymentRate: 3.4, gig_pct: 8.0, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 1236, active: 223, likelyActive: 318, uncertain: 348, likelyClosed: 347 } },
  ND: { population: 783926, medianIncome: 64577, povertyRate: 10.8, unemploymentRate: 2.0, gig_pct: 5.7, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 173, active: 68, likelyActive: 49, uncertain: 30, likelyClosed: 26 } },
  OH: { population: 11780017, medianIncome: 59855, povertyRate: 13.0, unemploymentRate: 3.6, gig_pct: 7.0, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 983, active: 267, likelyActive: 280, uncertain: 227, likelyClosed: 209 } },
  OK: { population: 4019800, medianIncome: 55826, povertyRate: 14.5, unemploymentRate: 3.0, gig_pct: 6.3, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 783, active: 191, likelyActive: 250, uncertain: 209, likelyClosed: 133 } },
  OR: { population: 4233358, medianIncome: 70084, povertyRate: 11.2, unemploymentRate: 3.7, gig_pct: 10.1, hasActiveLegislation: true, legislationTopics: ["OR Consumer Privacy Act (OCPA, eff. Jul 2024)"] , pharmacy: { independentCount: 282, active: 76, likelyActive: 95, uncertain: 64, likelyClosed: 47 } },
  PA: { population: 12961683, medianIncome: 67587, povertyRate: 11.1, unemploymentRate: 3.4, gig_pct: 7.5, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 1677, active: 393, likelyActive: 438, uncertain: 426, likelyClosed: 420 } },
  RI: { population: 1095962, medianIncome: 71169, povertyRate: 10.3, unemploymentRate: 3.2, gig_pct: 7.8, hasActiveLegislation: true, legislationTopics: ["RI Data Transparency & Privacy Protection Act (RIDTPPA, eff. Jan 2026)"] , pharmacy: { independentCount: 58, active: 17, likelyActive: 16, uncertain: 10, likelyClosed: 15 } },
  SC: { population: 5373555, medianIncome: 56227, povertyRate: 13.8, unemploymentRate: 3.1, gig_pct: 7.2, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 534, active: 126, likelyActive: 184, uncertain: 125, likelyClosed: 99 } },
  SD: { population: 919318, medianIncome: 63920, povertyRate: 12.5, unemploymentRate: 2.0, gig_pct: 6.0, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 141, active: 51, likelyActive: 44, uncertain: 28, likelyClosed: 18 } },
  TN: { population: 7126489, medianIncome: 59695, povertyRate: 12.8, unemploymentRate: 3.2, gig_pct: 7.6, hasActiveLegislation: true, legislationTopics: ["TN Information Protection Act (TIPA, eff. Jul 2025)"] , pharmacy: { independentCount: 906, active: 221, likelyActive: 275, uncertain: 211, likelyClosed: 199 } },
  TX: { population: 30503301, medianIncome: 67321, povertyRate: 13.4, unemploymentRate: 3.9, gig_pct: 10.2, hasActiveLegislation: true, legislationTopics: ["TX Data Privacy & Security Act (TDPSA, eff. Jul 2024)"] , pharmacy: { independentCount: 3977, active: 961, likelyActive: 1227, uncertain: 939, likelyClosed: 850 } },
  UT: { population: 3417734, medianIncome: 74197, povertyRate: 8.2, unemploymentRate: 2.6, gig_pct: 8.9, hasActiveLegislation: true, legislationTopics: ["UT Consumer Privacy Act (UCPA, eff. Dec 2023)"] , pharmacy: { independentCount: 331, active: 76, likelyActive: 107, uncertain: 92, likelyClosed: 56 } },
  VT: { population: 647464, medianIncome: 65792, povertyRate: 10.3, unemploymentRate: 2.1, gig_pct: 9.3, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 68, active: 20, likelyActive: 14, uncertain: 15, likelyClosed: 19 } },
  VA: { population: 8642274, medianIncome: 80963, povertyRate: 9.6, unemploymentRate: 2.7, gig_pct: 9.0, hasActiveLegislation: true, legislationTopics: ["VA Consumer Data Protection Act (CDPA, eff. Jan 2023)"] , pharmacy: { independentCount: 638, active: 175, likelyActive: 179, uncertain: 155, likelyClosed: 129 } },
  WA: { population: 7812880, medianIncome: 82228, povertyRate: 10.0, unemploymentRate: 3.8, gig_pct: 11.0, hasActiveLegislation: false, legislationTopics: ["WA My Health My Data Act (health-sector only, not comprehensive)", "AI Task Force"] , pharmacy: { independentCount: 585, active: 143, likelyActive: 157, uncertain: 136, likelyClosed: 149 } },
  WV: { population: 1770071, medianIncome: 48037, povertyRate: 17.1, unemploymentRate: 4.0, gig_pct: 4.9, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 369, active: 73, likelyActive: 98, uncertain: 106, likelyClosed: 92 } },
  WI: { population: 5910955, medianIncome: 66930, povertyRate: 10.6, unemploymentRate: 2.8, gig_pct: 6.5, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 593, active: 208, likelyActive: 127, uncertain: 160, likelyClosed: 98 } },
  WY: { population: 584057, medianIncome: 65003, povertyRate: 9.6, unemploymentRate: 2.8, gig_pct: 7.7, hasActiveLegislation: false, legislationTopics: [] , pharmacy: { independentCount: 69, active: 17, likelyActive: 23, uncertain: 16, likelyClosed: 13 } },
  DC: { population: 678972, medianIncome: 101722, povertyRate: 13.2, unemploymentRate: 4.5, gig_pct: 12.4, hasActiveLegislation: true, legislationTopics: ["DC Stop Discrimination by Algorithms Act"] , pharmacy: { independentCount: 88, active: 15, likelyActive: 37, uncertain: 17, likelyClosed: 19 } },
};

// Scale max values for metric normalization (shared across map dots + detail panel)
export const METRIC_MAXES = {
  population: 39_000_000,   // CA
  medianIncome: 102_000,    // DC
  unemploymentRate: 5.2,    // NV
  gig_pct: 13.2,            // CA
  povertyRate: 20,
  pharmacyCount: 4_819,     // NY
  activeCount: 1_318,       // NY
} as const;

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

// Helper: format pharmacy count
export function formatPharmacyCount(count: number): string {
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// RetailMyMeds monthly subscription price
export const MONTHLY_PRICE = 275;

// Average annual GLP-1 loss per independent pharmacy (from strategic research)
// $37-42 loss/fill × 394 avg fills/month × 12 months ≈ $174K/year
export const AVG_ANNUAL_GLP1_LOSS = 174_000;

// Helper: format revenue opportunity
export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}
