"use client";

import {
  Network,
  Layers,
  Target,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  MapPin,
  X,
} from "lucide-react";
import type { GraphStats, PivotPoint, NodeType } from "@/lib/graph-types";
import { NODE_COLORS, NODE_LABELS } from "@/lib/graph-types";

interface MapControlsProps {
  stats: GraphStats | null;
  pivotPoints: PivotPoint[];
  activeTypes: Set<NodeType>;
  stateStats: Map<string, number>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleTilt: () => void;
  isTilted: boolean;
  selectedState: string | null;
  onClearState: () => void;
}

export default function MapControls({
  stats,
  pivotPoints,
  activeTypes,
  stateStats,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleTilt,
  isTilted,
  selectedState,
  onClearState,
}: MapControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-sm">
      {/* Left: Stats */}
      <div className="flex items-center gap-4">
        {stats ? (
          <>
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-[#4a4540]" />
              <span className="text-[10px] text-[#8a8580]">
                <span className="text-[#f5f0eb] font-medium">
                  {stats.node_count}
                </span>{" "}
                nodes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8a8580]">
                <span className="text-[#f5f0eb] font-medium">
                  {stats.edge_count}
                </span>{" "}
                edges
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4a4540]" />
              <span className="text-[10px] text-[#8a8580]">
                <span className="text-[#f5f0eb] font-medium">
                  {stats.clusters}
                </span>{" "}
                clusters
              </span>
            </div>
            {pivotPoints.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#f39c12]" />
                <span className="text-[10px] text-[#8a8580]">
                  <span className="text-[#f5f0eb] font-medium">
                    {pivotPoints.length}
                  </span>{" "}
                  pivots
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-[10px] text-[#4a4540]">No data loaded</span>
        )}
      </div>

      {/* Center: Geographic info */}
      <div className="flex items-center gap-3">
        {stateStats.size > 0 && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#e67e22]" />
            <span className="text-[10px] text-[#8a8580]">
              <span className="text-[#e67e22] font-medium">
                {stateStats.size}
              </span>{" "}
              state{stateStats.size !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        {selectedState && (
          <button
            onClick={onClearState}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[9px] text-[#14b8a6] hover:bg-[#14b8a6]/20 transition-colors"
          >
            {selectedState}
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Right: Zoom controls + legend */}
      <div className="flex items-center gap-2">
        {/* Legend dots */}
        <div className="flex items-center gap-1.5 mr-2">
          {Array.from(activeTypes).map((type) => (
            <div key={type} className="flex items-center gap-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: NODE_COLORS[type] }}
              />
              <span className="text-[8px] text-[#4a4540]">
                {NODE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-[#1a1a1a]" />

        {/* Zoom controls */}
        <button
          onClick={onZoomIn}
          className="p-1 rounded hover:bg-[#1a1a1a] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1 rounded hover:bg-[#1a1a1a] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onReset}
          className="p-1 rounded hover:bg-[#1a1a1a] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Reset view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleTilt}
          className={`p-1 rounded transition-colors ${
            isTilted
              ? "bg-[#14b8a6]/10 text-[#14b8a6]"
              : "hover:bg-[#1a1a1a] text-[#8a8580] hover:text-[#f5f0eb]"
          }`}
          title="Toggle 2.5D tilt"
        >
          <Box className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
