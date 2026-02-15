import type { StateMetrics } from "./overlay-data";
import { STATE_NAMES } from "./fips-utils";
import { AVG_ANNUAL_GLP1_LOSS } from "./overlay-data";

export interface ExportRow {
  state: string;
  abbreviation: string;
  independentPharmacies: number;
  active: number;
  likelyActive: number;
  uncertain: number;
  likelyClosed: number;
  activeRate: string;
  contactable: number;
  densityPer100K: string;
  glp1LossExposure: string;
  population: number;
  medianIncome: number;
}

export function metricsToRows(metrics: Record<string, StateMetrics>): ExportRow[] {
  return Object.entries(metrics)
    .map(([abbr, m]) => {
      const p = m.pharmacy;
      const count = p?.independentCount ?? 0;
      const active = p?.active ?? 0;
      const likelyActive = p?.likelyActive ?? 0;
      const contactable = active + likelyActive;
      const activeRate = count > 0 ? (contactable / count) * 100 : 0;
      const density = m.population > 0 ? (count / m.population) * 100_000 : 0;
      const revenue = contactable * AVG_ANNUAL_GLP1_LOSS;

      return {
        state: STATE_NAMES[abbr] || abbr,
        abbreviation: abbr,
        independentPharmacies: count,
        active,
        likelyActive,
        uncertain: p?.uncertain ?? 0,
        likelyClosed: p?.likelyClosed ?? 0,
        activeRate: `${activeRate.toFixed(1)}%`,
        contactable,
        densityPer100K: density.toFixed(1),
        glp1LossExposure: `$${revenue.toLocaleString()}`,
        population: m.population,
        medianIncome: m.medianIncome,
      };
    })
    .sort((a, b) => a.state.localeCompare(b.state));
}

export function generateCSV(rows: ExportRow[]): string {
  const headers = [
    "State",
    "Abbreviation",
    "Independent Pharmacies",
    "Active",
    "Likely Active",
    "Uncertain",
    "Likely Closed",
    "Active Rate",
    "Contactable",
    "Density per 100K",
    "GLP-1 Loss Exposure",
    "Population",
    "Median Income",
  ];
  const lines = rows.map((r) =>
    [
      `"${r.state}"`,
      r.abbreviation,
      r.independentPharmacies,
      r.active,
      r.likelyActive,
      r.uncertain,
      r.likelyClosed,
      r.activeRate,
      r.contactable,
      r.densityPer100K,
      `"${r.glp1LossExposure}"`,
      r.population,
      r.medianIncome,
    ].join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function generateJSON(rows: ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
