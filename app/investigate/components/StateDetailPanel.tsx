"use client";

import { X, Users, DollarSign, Briefcase, TrendingUp, ShieldAlert } from "lucide-react";
import { STATE_NAMES } from "@/lib/fips-utils";
import { STATE_METRICS, formatPopulation, formatIncome } from "@/lib/overlay-data";

interface StateDetailPanelProps {
  stateAbbr: string | null;
  onClose: () => void;
}

// Scale max values for metric bars
const MAX_POP = 39_000_000;   // CA
const MAX_INCOME = 102_000;   // DC
const MAX_UNEMP = 5.2;        // NV
const MAX_GIG = 13.2;         // CA
const MAX_POVERTY = 20;

function MetricBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] mt-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function StateDetailPanel({ stateAbbr, onClose }: StateDetailPanelProps) {
  const isOpen = !!stateAbbr;
  const metrics = stateAbbr ? STATE_METRICS[stateAbbr] : null;
  const fullName = stateAbbr ? STATE_NAMES[stateAbbr] || stateAbbr : "";

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-80 z-20 pointer-events-none"
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="h-full pointer-events-auto card-glass border-l border-[#1a1a1a] overflow-y-auto">
        {/* Accent line top */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent" />

        {metrics && stateAbbr && (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-display text-[#f5f0eb]">{fullName}</h2>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono text-[#14b8a6] bg-[#14b8a6]/10 border border-[#14b8a6]/20">
                  {stateAbbr}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#4a4540] hover:text-[#f5f0eb] transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <h3 className="text-xs text-[#4a4540] uppercase tracking-[0.15em] font-medium">Key Metrics</h3>

              {/* Population */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <span className="text-xs text-[#8a8580]">Population</span>
                  </div>
                  <span className="text-sm font-mono text-[#f5f0eb]">
                    {formatPopulation(metrics.population)}
                  </span>
                </div>
                <MetricBar pct={(metrics.population / MAX_POP) * 100} color="#3b82f6" />
              </div>

              {/* Median Income */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span className="text-xs text-[#8a8580]">Median Income</span>
                  </div>
                  <span className="text-sm font-mono text-[#f5f0eb]">
                    {formatIncome(metrics.medianIncome)}
                  </span>
                </div>
                <MetricBar pct={(metrics.medianIncome / MAX_INCOME) * 100} color="#22c55e" />
              </div>

              {/* Unemployment */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-[#eab308]" />
                    <span className="text-xs text-[#8a8580]">Unemployment</span>
                  </div>
                  <span className="text-sm font-mono text-[#f5f0eb]">
                    {metrics.unemploymentRate}%
                  </span>
                </div>
                <MetricBar pct={(metrics.unemploymentRate / MAX_UNEMP) * 100} color="#eab308" />
              </div>

              {/* Gig Economy */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#14b8a6]" />
                    <span className="text-xs text-[#8a8580]">Gig Economy</span>
                  </div>
                  <span className="text-sm font-mono text-[#f5f0eb]">
                    {metrics.gig_pct}%
                  </span>
                </div>
                <MetricBar pct={(metrics.gig_pct / MAX_GIG) * 100} color="#14b8a6" />
              </div>
            </div>

            {/* Poverty */}
            <div className="space-y-2">
              <h3 className="text-xs text-[#4a4540] uppercase tracking-[0.15em] font-medium">Poverty Rate</h3>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8a8580]">Below poverty line</span>
                  <span className="text-sm font-mono text-[#f5f0eb]">
                    {metrics.povertyRate}%
                  </span>
                </div>
                <MetricBar pct={(metrics.povertyRate / MAX_POVERTY) * 100} color="#f59e0b" />
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-[#4a4540]">0%</span>
                  <span className="text-[10px] text-[#4a4540]">20%</span>
                </div>
              </div>
            </div>

            {/* Legislation */}
            <div className="space-y-2">
              <h3 className="text-xs text-[#4a4540] uppercase tracking-[0.15em] font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Legislation
              </h3>
              {metrics.hasActiveLegislation ? (
                <div className="space-y-2">
                  <span className="text-xs text-[#ef4444] font-medium">Active Legislation</span>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.legislationTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#4a4540]">No active data privacy legislation</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
