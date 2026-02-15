import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Users, DollarSign, Phone, MapPin, Store } from "lucide-react";
import {
  FALLBACK_STATE_METRICS,
  formatPopulation,
  formatPharmacyCount,
  formatRevenue,
  AVG_ANNUAL_GLP1_LOSS,
} from "@/lib/overlay-data";
import { STATE_NAMES } from "@/lib/fips-utils";
import { computeStateRanks } from "@/lib/state-rankings";

const allRanks = computeStateRanks(FALLBACK_STATE_METRICS);
const totalStates = Object.keys(FALLBACK_STATE_METRICS).length;

export function generateStaticParams() {
  return Object.keys(FALLBACK_STATE_METRICS).map((abbr) => ({ abbr }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ abbr: string }>;
}): Promise<Metadata> {
  const { abbr } = await params;
  const upper = abbr.toUpperCase();
  const name = STATE_NAMES[upper] || upper;
  const m = FALLBACK_STATE_METRICS[upper];

  if (!m || !m.pharmacy) {
    return { title: "State Not Found | Meridian" };
  }

  const p = m.pharmacy;
  const contactable = p.active + p.likelyActive;
  const activeRate = p.independentCount > 0
    ? Math.round((contactable / p.independentCount) * 100)
    : 0;

  return {
    title: `${name} Pharmacy Market | Meridian`,
    description: `${name}: ${p.independentCount} independent pharmacies, ${contactable} contactable, ${activeRate}% active rate. Market intelligence for pharmacy outreach.`,
  };
}

const STATUS_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444"];
const STATUS_LABELS = ["Active", "Likely Active", "Uncertain", "Likely Closed"];

function RankBadge({ rank, label }: { rank: number; label: string }) {
  const color =
    rank <= 5
      ? "text-[#14b8a6] bg-[#14b8a6]/10"
      : rank <= 15
        ? "text-[#f97316] bg-[#f97316]/10"
        : "text-[#4a4540] bg-[#1a1a1a]";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>
        #{rank}
      </span>
      <span className="text-[10px] text-[#4a4540] uppercase tracking-wider">
        of {totalStates} &middot; {label}
      </span>
    </div>
  );
}

export default async function StateProfilePage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  const upper = abbr.toUpperCase();
  const name = STATE_NAMES[upper] || upper;
  const m = FALLBACK_STATE_METRICS[upper];
  const ranks = allRanks[upper];

  if (!m || !ranks) {
    return (
      <div className="min-h-screen bg-[#050505] pt-14 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-[#f5f0eb] mb-2">State not found</h1>
          <Link href="/rank" className="text-sm text-[#14b8a6] hover:underline">
            Back to rankings
          </Link>
        </div>
      </div>
    );
  }

  const p = m.pharmacy;
  const count = p?.independentCount ?? 0;
  const contactable = (p?.active ?? 0) + (p?.likelyActive ?? 0);
  const activeRate = count > 0 ? Math.round((contactable / count) * 100) : 0;
  const densityPer100K = m.population > 0
    ? ((count / m.population) * 100_000).toFixed(1)
    : "0.0";
  const glp1Exposure = contactable * AVG_ANNUAL_GLP1_LOSS;

  const statusCounts = [
    p?.active ?? 0,
    p?.likelyActive ?? 0,
    p?.uncertain ?? 0,
    p?.likelyClosed ?? 0,
  ];

  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/rank"
          className="inline-flex items-center gap-1.5 text-xs text-[#4a4540] hover:text-[#8a8580] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to rankings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-3">
            Independent Pharmacy Market
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[#f5f0eb] tracking-[-0.03em]">
            {name}
          </h1>
          <p className="mt-2 text-sm text-[#8a8580]">
            {upper} &middot; {formatPharmacyCount(count)} independent pharmacies &middot; Population {formatPopulation(m.population)}
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#14b8a6]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">Independent Pharmacies</span>
            </div>
            <div className="text-2xl font-display text-[#f5f0eb]">
              {formatPharmacyCount(count)}
            </div>
            <RankBadge rank={ranks.pharmacyCount} label="by pharmacy count" />
          </div>

          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">Contactable</span>
            </div>
            <div className="text-2xl font-display text-[#f5f0eb]">
              {contactable.toLocaleString()}
            </div>
            <RankBadge rank={ranks.contactable} label="by contactable" />
          </div>

          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">Active Rate</span>
            </div>
            <div className={`text-2xl font-display ${
              activeRate >= 50 ? "text-[#22c55e]" : activeRate >= 35 ? "text-[#eab308]" : "text-[#ef4444]"
            }`}>
              {activeRate}%
            </div>
            <RankBadge rank={ranks.activeRate} label="by active rate" />
          </div>

          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f97316]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">Density per 100K</span>
            </div>
            <div className="text-2xl font-display text-[#f5f0eb]">
              {densityPer100K}
            </div>
            <RankBadge rank={ranks.density} label="by density" />
          </div>

          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#22c55e]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">GLP-1 Loss Exposure</span>
            </div>
            <div className="text-2xl font-display text-[#f5f0eb]">
              {formatRevenue(glp1Exposure)}
            </div>
            <div className="text-[10px] text-[#4a4540]">
              Based on $174K avg annual GLP-1 loss per pharmacy
            </div>
            <RankBadge rank={ranks.revenuePotential} label="by GLP-1 exposure" />
          </div>

          <div className="card-glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8a8580]" />
              <span className="text-xs text-[#4a4540] uppercase tracking-wider">Population</span>
            </div>
            <div className="text-2xl font-display text-[#8a8580]">
              {formatPopulation(m.population)}
            </div>
            <RankBadge rank={ranks.population} label="by population" />
          </div>
        </div>

        {/* Why This Matters */}
        <div className="card-glass rounded-xl p-5 mb-8 border-l-2 border-[#14b8a6]/40">
          <div className="text-[10px] text-[#4a4540] uppercase tracking-[0.15em] font-medium mb-2">
            Why This Matters
          </div>
          <p className="text-xs text-[#8a8580] leading-relaxed">
            Independent pharmacies lose $37-42 per GLP-1 fill. At ~394 avg fills/month,
            that&apos;s ~$174K/year in losses per pharmacy. States with more active pharmacies
            represent larger prescription routing opportunities.
          </p>
        </div>

        {/* Status Breakdown */}
        <div className="card-glass rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 text-xs text-[#4a4540] uppercase tracking-[0.1em] font-medium mb-4">
            Status Breakdown
          </div>
          <div className="space-y-3">
            {statusCounts.map((val, i) => {
              const pct = count > 0 ? (val / count) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[i] }}
                      />
                      <span className="text-[#f5f0eb]">{STATUS_LABELS[i]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8a8580] tabular-nums">{val.toLocaleString()}</span>
                      <span className="text-[#4a4540] tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_COLORS[i],
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="accent-line mb-8" />
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/compare?states=${upper}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#14b8a6]/10 border border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/20 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            Compare with other states
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#0a0a0a] border border-[#1a1a1a] text-[#8a8580] hover:border-[#2a2a2a] hover:text-[#f5f0eb] transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            View on Map
          </Link>
        </div>
      </div>
    </div>
  );
}
