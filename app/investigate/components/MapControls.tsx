"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  X,
  Layers,
} from "lucide-react";
import type { OverlayId } from "@/lib/overlay-data";
import { OVERLAY_CONFIGS } from "@/lib/overlay-data";
import ParticleBurst from "./ParticleBurst";

interface MapControlsProps {
  selectedState: string | null;
  onClearState: () => void;
  activeOverlays: Set<OverlayId>;
  onToggleOverlay: (id: OverlayId) => void;
}

export default function MapControls({
  selectedState,
  onClearState,
  activeOverlays,
  onToggleOverlay,
}: MapControlsProps) {
  const [burstKey, setBurstKey] = useState(0);
  const [burstId, setBurstId] = useState<OverlayId | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  function handleToggle(id: OverlayId) {
    onToggleOverlay(id);
    setBurstId(id);
    setBurstKey((k) => k + 1);
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => setBurstId(null), 600);
  }

  return (
    <div className="relative flex items-center justify-center px-5 py-3 border-t border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-sm">
      <div className="accent-line absolute top-0 left-0 right-0" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-2">
          <Layers className="w-4 h-4 text-[#4a4540]" />
          <span className="text-xs text-[#4a4540] uppercase tracking-[0.1em] font-medium">
            Data Layers
          </span>
          {activeOverlays.size > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[10px] text-[#14b8a6] font-medium">
              {activeOverlays.size}
            </span>
          )}
        </div>
        {OVERLAY_CONFIGS.map((config) => {
          const active = activeOverlays.has(config.id);
          return (
            <button
              key={config.id}
              onClick={() => handleToggle(config.id)}
              className={`relative overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                active
                  ? "border-current/30 bg-current/10"
                  : "text-[#4a4540] border-transparent hover:text-[#8a8580] hover:bg-[#1a1a1a]"
              }`}
              style={active ? { color: config.color, borderColor: `${config.color}33`, backgroundColor: `${config.color}1a` } : undefined}
              title={config.description}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: active ? config.color : "#4a4540" }}
              />
              {config.label}
              {burstId === config.id && (
                <ParticleBurst key={burstKey} color={config.color} />
              )}
            </button>
          );
        })}

        {selectedState && (
          <>
            <div className="h-4 w-px bg-[#2a2a2a]" />
            <button
              onClick={onClearState}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-sm text-[#14b8a6] hover:bg-[#14b8a6]/20 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {selectedState}
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
