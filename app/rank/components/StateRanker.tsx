"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Check,
} from "lucide-react";
import { FALLBACK_STATE_METRICS, formatPopulation, formatIncome } from "@/lib/overlay-data";
import { fetchLiveMetrics } from "@/lib/data-fetcher";
import {
  computeRankings,
  weightsToParams,
  paramsToWeights,
  DEFAULT_WEIGHTS,
  PRESETS,
} from "@/lib/ranking";
import type { RankingWeights } from "@/lib/ranking";
import { STATE_NAMES } from "@/lib/fips-utils";
import { metricsToRows, generateCSV, generateJSON, downloadFile } from "@/lib/export";

const SLIDER_FIELDS: { key: keyof RankingWeights; label: string; description: string }[] = [
  { key: "lowUnemployment", label: "Low Unemployment", description: "Prefer states with low jobless rates" },
  { key: "highIncome", label: "High Income", description: "Prefer states with high median household income" },
  { key: "lowPoverty", label: "Low Poverty", description: "Prefer states with low poverty rates" },
  { key: "lowCost", label: "Low Cost of Living", description: "Prefer states where cost of living is lower" },
  { key: "gigEconomy", label: "Gig Economy", description: "Prefer states with thriving freelance/gig work" },
];

export default function StateRanker() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [metrics, setMetrics] = useState(FALLBACK_STATE_METRICS);
  const [isLive, setIsLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Initialize weights from URL params or defaults
  const [weights, setWeights] = useState<RankingWeights>(() => {
    const wParam = searchParams.get("w");
    const presetParam = searchParams.get("preset");
    if (wParam) {
      const parsed = paramsToWeights(wParam);
      if (parsed) return parsed;
    }
    if (presetParam && PRESETS[presetParam]) {
      return PRESETS[presetParam].weights;
    }
    return DEFAULT_WEIGHTS;
  });

  const [activePreset, setActivePreset] = useState<string | null>(() => {
    return searchParams.get("preset") || null;
  });

  // Fetch live data
  useEffect(() => {
    fetchLiveMetrics().then((result) => {
      setMetrics(result.metrics);
      setIsLive(result.isLive);
    });
  }, []);

  // Debounced URL update -- immediate state update, URL batched at 150ms
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateUrl = useCallback(
    (w: RankingWeights, preset: string | null) => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
      urlTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams();
        params.set("w", weightsToParams(w));
        if (preset) params.set("preset", preset);
        router.replace(`/rank?${params.toString()}`, { scroll: false });
      }, 150);
    },
    [router]
  );

  // Compute rankings
  const rankings = useMemo(() => computeRankings(metrics, weights), [metrics, weights]);

  function handleSliderChange(key: keyof RankingWeights, value: number) {
    const next = { ...weights, [key]: value };
    setWeights(next);
    setActivePreset(null);
    updateUrl(next, null);
  }

  function handlePreset(key: string) {
    const preset = PRESETS[key];
    if (!preset) return;
    setWeights(preset.weights);
    setActivePreset(key);
    updateUrl(preset.weights, key);
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport(format: "csv" | "json") {
    const rows = metricsToRows(metrics);
    if (format === "csv") {
      downloadFile(generateCSV(rows), "meridian-state-data.csv", "text/csv");
    } else {
      downloadFile(generateJSON(rows), "meridian-state-data.json", "application/json");
    }
    setShowExportMenu(false);
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-4">
            Decision Tool
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[#f5f0eb] tracking-[-0.03em]">
            Best states{" "}
            <em className="font-display italic text-[#14b8a6]">for you</em>
          </h1>
          <p className="mt-3 text-sm text-[#8a8580] max-w-lg mx-auto">
            Drag the sliders to weight what matters most. All 50 states + DC
            ranked in real time.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#22c55e]" : "bg-[#4a4540]"}`}
            />
            <span className="text-[10px] text-[#4a4540] uppercase tracking-wider">
              {isLive ? "Live Data" : "Static Data"}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8">
          {/* Left column: Controls */}
          <div className="space-y-6">
            {/* Presets */}
            <div className="card-glass rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#4a4540] uppercase tracking-[0.1em]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Presets
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePreset(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activePreset === key
                        ? "bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30"
                        : "bg-[#0a0a0a] text-[#8a8580] border border-[#1a1a1a] hover:border-[#2a2a2a] hover:text-[#f5f0eb]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="card-glass rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-xs text-[#4a4540] uppercase tracking-[0.1em]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Weights
              </div>
              {SLIDER_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[#f5f0eb]">{field.label}</label>
                    <span className="text-xs text-[#4a4540] tabular-nums w-8 text-right">
                      {weights[field.key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[field.key]}
                    onChange={(e) => handleSliderChange(field.key, Number(e.target.value))}
                    className="w-full accent-[#14b8a6] h-1.5 bg-[#1a1a1a] rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                  />
                  <p className="text-[10px] text-[#4a4540]">{field.description}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#0a0a0a] border border-[#1a1a1a] text-[#8a8580] hover:border-[#14b8a6]/30 hover:text-[#f5f0eb] transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </>
                )}
              </button>
              <div className="relative flex-1">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#0a0a0a] border border-[#1a1a1a] text-[#8a8580] hover:border-[#14b8a6]/30 hover:text-[#f5f0eb] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute top-full mt-1 left-0 right-0 card-glass rounded-lg border border-[#1a1a1a] overflow-hidden z-20">
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full px-3 py-2 text-xs text-[#8a8580] hover:bg-[#14b8a6]/10 hover:text-[#f5f0eb] text-left transition-colors"
                    >
                      Download CSV
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full px-3 py-2 text-xs text-[#8a8580] hover:bg-[#14b8a6]/10 hover:text-[#f5f0eb] text-left transition-colors"
                    >
                      Download JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Rankings list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#4a4540] uppercase tracking-[0.1em]">
                {rankings.length} states ranked
              </span>
            </div>

            {rankings.map((state) => {
              const isExpanded = expandedState === state.abbr;
              const name = STATE_NAMES[state.abbr] || state.abbr;
              const scorePercent = Math.round(state.score * 100);

              return (
                <div
                  key={state.abbr}
                  className="card-glass rounded-lg overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedState(isExpanded ? null : state.abbr)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Rank badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                        state.rank <= 3
                          ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                          : state.rank <= 10
                            ? "bg-[#f97316]/10 text-[#f97316]"
                            : "bg-[#1a1a1a] text-[#4a4540]"
                      }`}
                    >
                      {state.rank <= 3 ? (
                        <Trophy className="w-3.5 h-3.5" />
                      ) : (
                        state.rank
                      )}
                    </div>

                    {/* State name + score bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#f5f0eb]">
                          {state.rank <= 3 && (
                            <span className="text-[#14b8a6] mr-1.5">#{state.rank}</span>
                          )}
                          {name}
                        </span>
                        <span className="text-xs text-[#4a4540] tabular-nums">{scorePercent}%</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${scorePercent}%`,
                            background:
                              state.rank <= 3
                                ? "#14b8a6"
                                : state.rank <= 10
                                  ? "#f97316"
                                  : "#4a4540",
                          }}
                        />
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <div className="shrink-0 text-[#4a4540]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#1a1a1a]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Population
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {formatPopulation(state.metrics.population)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Median Income
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {formatIncome(state.metrics.medianIncome)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Unemployment
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {state.metrics.unemploymentRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Poverty Rate
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {state.metrics.povertyRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Gig Economy
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {state.metrics.gig_pct}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                            Privacy Law
                          </div>
                          <div className="text-sm text-[#f5f0eb]">
                            {state.metrics.hasActiveLegislation ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/compare?states=${state.abbr}`}
                          className="text-[10px] text-[#14b8a6] hover:underline uppercase tracking-wider"
                        >
                          Compare
                        </Link>
                        <span className="text-[#1a1a1a]">|</span>
                        <Link
                          href={`/explore`}
                          className="text-[10px] text-[#14b8a6] hover:underline uppercase tracking-wider"
                        >
                          View on Map
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
