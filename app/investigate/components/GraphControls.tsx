"use client";

import { Network, Target, Layers } from "lucide-react";
import type { GraphStats, PivotPoint, NodeType } from "@/lib/graph-types";
import { NODE_COLORS, NODE_LABELS } from "@/lib/graph-types";

interface GraphControlsProps {
  stats: GraphStats | null;
  pivotPoints: PivotPoint[];
  activeTypes: Set<NodeType>;
}

export default function GraphControls({
  stats,
  pivotPoints,
  activeTypes,
}: GraphControlsProps) {
  if (!stats) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-sm">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-[#4a4540]" />
          <span className="text-[10px] text-[#8a8580]">
            <span className="text-[#f5f0eb] font-medium">{stats.node_count}</span>{" "}
            nodes
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8a8580]">
            <span className="text-[#f5f0eb] font-medium">{stats.edge_count}</span>{" "}
            edges
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#4a4540]" />
          <span className="text-[10px] text-[#8a8580]">
            <span className="text-[#f5f0eb] font-medium">{stats.clusters}</span>{" "}
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
              pivot points
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        {Array.from(activeTypes).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className="text-[9px] text-[#4a4540]">
              {NODE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
