"use client";

import { ZoomIn, ZoomOut, Maximize2, Box } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleTilt: () => void;
  isTilted: boolean;
  isPanelOpen?: boolean;
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleTilt,
  isTilted,
  isPanelOpen = false,
}: ZoomControlsProps) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 z-10 animate-stagger-3"
      style={{
        right: isPanelOpen ? 340 : 16,
        transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="card-glass rounded-xl flex flex-col items-center gap-1 p-1.5">
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg hover:bg-white/5 text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg hover:bg-white/5 text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-5 h-px bg-[#2a2a2a]" />
        <button
          onClick={onReset}
          className="p-2 rounded-lg hover:bg-white/5 text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleTilt}
          className={`p-2 rounded-lg transition-colors ${
            isTilted
              ? "bg-[#14b8a6]/10 text-[#14b8a6]"
              : "hover:bg-white/5 text-[#8a8580] hover:text-[#f5f0eb]"
          }`}
          title="Toggle 2.5D tilt"
        >
          <Box className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
