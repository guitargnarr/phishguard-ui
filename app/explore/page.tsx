"use client";

import { useState, useRef, useEffect } from "react";
import { BarChart3, MapPin } from "lucide-react";
import type { OverlayId, StateMetrics } from "@/lib/overlay-data";
import { OVERLAY_CONFIGS, FALLBACK_STATE_METRICS } from "@/lib/overlay-data";
import { fetchLiveMetrics } from "@/lib/data-fetcher";
import InteractiveMap from "./components/InteractiveMap";
import MapControls from "./components/MapControls";
import ZoomControls from "./components/ZoomControls";
import StateDetailPanel from "./components/StateDetailPanel";
import type { InteractiveMapHandle } from "./components/InteractiveMap";

export default function ExplorePage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isTilted, setIsTilted] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayId>>(new Set());
  const [hintDismissed, setHintDismissed] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, StateMetrics>>(FALLBACK_STATE_METRICS);
  const [isLiveData, setIsLiveData] = useState(false);

  const mapRef = useRef<InteractiveMapHandle>(null);

  // Fetch live BLS + Census data on mount
  useEffect(() => {
    fetchLiveMetrics().then((result) => {
      setLiveMetrics(result.metrics);
      setIsLiveData(result.isLive);
    });
  }, []);

  // Auto-dismiss hint after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setHintDismissed(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  function handleToggleOverlay(id: OverlayId) {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleStateClick(stateAbbr: string) {
    setHintDismissed(true);
    if (!stateAbbr) {
      setSelectedState(null);
      return;
    }
    setSelectedState(stateAbbr === selectedState ? null : stateAbbr);
  }

  // Find first active choropleth overlay with a gradient legend
  const activeLegend = OVERLAY_CONFIGS.find(
    (c) => activeOverlays.has(c.id) && c.legend?.type === "gradient"
  );

  return (
    <div className="h-screen flex flex-col bg-[#050505]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#050505]/90 backdrop-blur-sm z-10 entrance-header">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-[#f5f0eb] hover:text-[#14b8a6] transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-[#14b8a6]" />
            <span className="text-lg font-semibold tracking-tight">
              Meridian
            </span>
          </a>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <span className="text-sm text-[#4a4540] uppercase tracking-[0.15em] font-medium">
            US Economic Data
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="/"
            className="text-sm text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          >
            Home
          </a>
          <a
            href="/explore"
            className="text-sm text-[#14b8a6]"
          >
            Explore
          </a>
        </nav>
      </header>

      {/* Full-width map */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className="flex-1 relative min-h-0 entrance-map"
          style={
            isTilted
              ? {
                  transform: "perspective(1200px) rotateX(20deg)",
                  transformOrigin: "center center",
                }
              : undefined
          }
        >
          <InteractiveMap
            ref={mapRef}
            onStateClick={handleStateClick}
            selectedState={selectedState}
            activeOverlays={activeOverlays}
            stateMetrics={liveMetrics}
          />

          {/* Floating zoom controls */}
          <ZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onReset={() => {
              mapRef.current?.resetZoom();
              setSelectedState(null);
            }}
            onToggleTilt={() => setIsTilted((v) => !v)}
            isTilted={isTilted}
            isPanelOpen={!!selectedState}
          />

          {/* State detail panel */}
          <StateDetailPanel
            stateAbbr={selectedState}
            onClose={() => {
              setSelectedState(null);
              mapRef.current?.resetZoom();
            }}
            stateMetrics={liveMetrics}
          />

          {/* Color legend bar */}
          {activeLegend?.legend && (
            <div
              key={activeLegend.id}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 entrance-legend"
            >
              <div className="card-glass rounded-lg px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-[#8a8580] whitespace-nowrap">
                  {activeLegend.legend.minLabel}
                </span>
                <div
                  className="w-32 h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${activeLegend.legend.stops.join(", ")})`,
                  }}
                />
                <span className="text-xs text-[#8a8580] whitespace-nowrap">
                  {activeLegend.legend.maxLabel}
                </span>
              </div>
            </div>
          )}

          {/* Data source indicator */}
          <div className="absolute top-3 right-3 z-10">
            <div className="card-glass rounded px-2 py-1 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isLiveData ? "bg-[#22c55e]" : "bg-[#4a4540]"}`}
              />
              <span className="text-[10px] text-[#4a4540] uppercase tracking-wider">
                {isLiveData ? "Live Data" : "Static Data"}
              </span>
            </div>
          </div>

          {/* "Click any state" hint */}
          {!selectedState && !hintDismissed && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 entrance-hint">
              <div className="card-glass rounded-full px-4 py-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#14b8a6]" />
                <span className="text-sm text-[#8a8580] whitespace-nowrap">
                  Click any state to explore
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="shrink-0 entrance-controls">
          <MapControls
            selectedState={selectedState}
            onClearState={() => {
              setSelectedState(null);
              mapRef.current?.resetZoom();
            }}
            activeOverlays={activeOverlays}
            onToggleOverlay={handleToggleOverlay}
          />
        </div>
      </main>
    </div>
  );
}
