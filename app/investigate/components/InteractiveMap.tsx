"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { GraphResponse } from "@/lib/graph-types";
import { FIPS_TO_STATE, STATE_NAMES } from "@/lib/fips-utils";

// ── Types ────────────────────────────────────────────────────────────────

interface StateProperties {
  name: string;
}

interface CountyProperties {
  name: string;
}

type USTopology = Topology<{
  states: GeometryCollection<StateProperties>;
  counties?: GeometryCollection<CountyProperties>;
}>;

type CountyTopology = Topology<{
  counties: GeometryCollection<CountyProperties>;
}>;

interface InteractiveMapProps {
  stateStats: Map<string, number>;
  graphData: GraphResponse | null;
  onStateClick?: (stateAbbr: string) => void;
  selectedState?: string | null;
}

export interface InteractiveMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

// ── Component ────────────────────────────────────────────────────────────

const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(
  function InteractiveMap(
    { stateStats, graphData, onStateClick, selectedState },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const projectionRef = useRef<d3.GeoProjection | null>(null);
    const pathRef = useRef<d3.GeoPath<unknown, d3.GeoPermissibleObjects> | null>(null);

    const [stateTopoData, setStateTopoData] = useState<USTopology | null>(null);
    const [countyTopoData, setCountyTopoData] = useState<CountyTopology | null>(null);
    const [countiesLoading, setCountiesLoading] = useState(false);
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
    const [hoveredCount, setHoveredCount] = useState<number>(0);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [currentZoom, setCurrentZoom] = useState(1);

    const maxCount = Math.max(1, ...Array.from(stateStats.values()));

    // Color scale: void -> teal -> orange for density
    const colorScale = useCallback(
      (count: number) => {
        if (count === 0) return "#0a0a0a";
        const t = count / maxCount;
        return d3.interpolateRgbBasis(["#0d3d36", "#14b8a6", "#e67e22"])(t);
      },
      [maxCount]
    );

    // ── Expose zoom controls via ref ──────────────────────────────────

    useImperativeHandle(ref, () => ({
      zoomIn() {
        if (svgRef.current && zoomRef.current) {
          const svg = d3.select(svgRef.current);
          svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
        }
      },
      zoomOut() {
        if (svgRef.current && zoomRef.current) {
          const svg = d3.select(svgRef.current);
          svg.transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.5);
        }
      },
      resetZoom() {
        if (svgRef.current && zoomRef.current) {
          const svg = d3.select(svgRef.current);
          svg
            .transition()
            .duration(750)
            .call(
              zoomRef.current.transform,
              d3.zoomIdentity
            );
        }
      },
    }));

    // ── Fetch state TopoJSON ──────────────────────────────────────────

    useEffect(() => {
      fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        .then((r) => r.json())
        .then((data: USTopology) => setStateTopoData(data))
        .catch(() => {});
    }, []);

    // ── Lazy-load county TopoJSON ─────────────────────────────────────

    const loadCounties = useCallback(() => {
      if (countyTopoData || countiesLoading) return;
      setCountiesLoading(true);
      fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
        .then((r) => r.json())
        .then((data: CountyTopology) => {
          setCountyTopoData(data);
          setCountiesLoading(false);
        })
        .catch(() => setCountiesLoading(false));
    }, [countyTopoData, countiesLoading]);

    // Trigger county load when zoomed in or state selected
    useEffect(() => {
      if (currentZoom > 3 || selectedState) {
        loadCounties();
      }
    }, [currentZoom, selectedState, loadCounties]);

    // ── Tooltip mouse tracking ────────────────────────────────────────

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    // ── Main D3 render ────────────────────────────────────────────────

    useEffect(() => {
      if (!stateTopoData || !svgRef.current || !containerRef.current) return;

      const svg = d3.select(svgRef.current);
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      svg.attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      // Projection: Mercator centered on CONUS
      const stateFeatures = topojson.feature(
        stateTopoData,
        stateTopoData.objects.states
      ).features;

      const projection = d3
        .geoMercator()
        .fitSize([width, height], {
          type: "FeatureCollection",
          features: stateFeatures,
        });

      const path = d3.geoPath().projection(projection);

      projectionRef.current = projection;
      pathRef.current = path;

      // Main group (zoom/pan target)
      const g = svg.append("g");
      gRef.current = g;

      // County layer (initially hidden, rendered when data available)
      const countyGroup = g.append("g").attr("class", "counties").style("opacity", 0);

      // State fill layer
      const stateGroup = g.append("g").attr("class", "states");

      // State border mesh layer
      const borderGroup = g.append("g").attr("class", "state-borders");

      // Label layer
      const labelGroup = g.append("g").attr("class", "labels").style("opacity", 0);

      // ── Draw states (fill) ──────────────────────────────────────────

      stateGroup
        .selectAll("path")
        .data(stateFeatures)
        .join("path")
        .attr("d", (d) => path(d) || "")
        .attr("fill", (d) => {
          const fips = String(d.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          const count = stateAbbr ? stateStats.get(stateAbbr) || 0 : 0;
          return colorScale(count);
        })
        .attr("stroke", "none")
        .attr("cursor", "pointer")
        .on("mouseenter", function (_, d) {
          const fips = String(d.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          const count = stateAbbr ? stateStats.get(stateAbbr) || 0 : 0;
          const name = stateAbbr
            ? STATE_NAMES[stateAbbr] || stateAbbr
            : "Unknown";
          setHoveredFeature(name);
          setHoveredCount(count);
          d3.select(this).attr("stroke", "#14b8a6").attr("stroke-width", 1.5);
        })
        .on("mouseleave", function () {
          setHoveredFeature(null);
          d3.select(this).attr("stroke", "none");
        })
        .on("click", (event, d) => {
          event.stopPropagation();
          const fips = String(d.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          if (!stateAbbr) return;

          onStateClick?.(stateAbbr);

          // Zoom to state bounds
          const bounds = path.bounds(d);
          const dx = bounds[1][0] - bounds[0][0];
          const dy = bounds[1][1] - bounds[0][1];
          const cx = (bounds[0][0] + bounds[1][0]) / 2;
          const cy = (bounds[0][1] + bounds[1][1]) / 2;
          const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
          const translate: [number, number] = [
            width / 2 - scale * cx,
            height / 2 - scale * cy,
          ];

          if (zoomRef.current) {
            svg
              .transition()
              .duration(750)
              .call(
                zoomRef.current.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
              );
          }
        });

      // ── Draw state borders (mesh) ───────────────────────────────────

      const stateMesh = topojson.mesh(
        stateTopoData,
        stateTopoData.objects.states,
        (a, b) => a !== b
      );

      borderGroup
        .append("path")
        .datum(stateMesh)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#2a2a2a")
        .attr("stroke-width", 1)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      // ── State labels ────────────────────────────────────────────────

      stateFeatures.forEach((feature) => {
        const fips = String(feature.id).padStart(2, "0");
        const stateAbbr = FIPS_TO_STATE[fips];
        if (!stateAbbr) return;
        const centroid = path.centroid(feature);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) return;
        labelGroup
          .append("text")
          .attr("x", centroid[0])
          .attr("y", centroid[1])
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 8)
          .attr("fill", "#4a4540")
          .attr("pointer-events", "none")
          .text(stateAbbr);
      });

      // ── Zoom behavior ───────────────────────────────────────────────

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 20])
        .on("zoom", (event) => {
          g.attr("transform", event.transform.toString());
          const k = event.transform.k;
          setCurrentZoom(k);

          // Show counties when zoomed in past 3x
          countyGroup.style("opacity", k > 3 ? 1 : 0);

          // Show labels at mid-zoom
          labelGroup.style("opacity", k > 2 && k < 10 ? 1 : 0);
        });

      zoomRef.current = zoom;

      svg.call(zoom);

      // Double-click to reset
      svg.on("dblclick.zoom", null);
      svg.on("dblclick", () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        onStateClick?.(/* clear */ "");
      });
    }, [stateTopoData, stateStats, colorScale, onStateClick]);

    // ── Update county layer when county data loads ────────────────────

    useEffect(() => {
      if (!countyTopoData || !gRef.current || !pathRef.current) return;

      const path = pathRef.current;
      const countyGroup = gRef.current.select<SVGGElement>(".counties");

      // Only render if empty
      if (!countyGroup.selectAll("path").empty()) return;

      const countyFeatures = topojson.feature(
        countyTopoData,
        countyTopoData.objects.counties
      ).features;

      countyGroup
        .selectAll("path")
        .data(countyFeatures)
        .join("path")
        .attr("d", (d) => path(d as d3.GeoPermissibleObjects) || "")
        .attr("fill", "none")
        .attr("stroke", "#1a1a1a")
        .attr("stroke-width", 0.3)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      // Show if already zoomed in
      countyGroup.style("opacity", currentZoom > 3 ? 1 : 0);
    }, [countyTopoData, currentZoom]);

    // ── Update fills when stateStats change ───────────────────────────

    useEffect(() => {
      if (!gRef.current) return;
      gRef.current
        .select(".states")
        .selectAll<SVGPathElement, d3.GeoPermissibleObjects>("path")
        .attr("fill", (d) => {
          const feature = d as GeoJSON.Feature & { id?: string | number };
          const fips = String(feature.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          const count = stateAbbr ? stateStats.get(stateAbbr) || 0 : 0;
          return colorScale(count);
        });
    }, [stateStats, colorScale]);

    // ── Zoom to selected state from parent ────────────────────────────

    useEffect(() => {
      if (
        !selectedState ||
        !svgRef.current ||
        !zoomRef.current ||
        !stateTopoData ||
        !pathRef.current ||
        !containerRef.current
      )
        return;

      const path = pathRef.current;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const stateFeatures = topojson.feature(
        stateTopoData,
        stateTopoData.objects.states
      ).features;

      // Find the matching state feature
      const target = stateFeatures.find((f) => {
        const fips = String(f.id).padStart(2, "0");
        return FIPS_TO_STATE[fips] === selectedState;
      });

      if (!target) return;

      const bounds = path.bounds(target);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const cx = (bounds[0][0] + bounds[1][0]) / 2;
      const cy = (bounds[0][1] + bounds[1][1]) / 2;
      const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
      const translate: [number, number] = [
        width / 2 - scale * cx,
        height / 2 - scale * cy,
      ];

      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(750)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    }, [selectedState, stateTopoData]);

    // ── Resize handler ────────────────────────────────────────────────

    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver(() => {
        // Re-render on resize by clearing and re-triggering
        if (stateTopoData && svgRef.current) {
          const width = containerRef.current?.clientWidth || 0;
          const height = containerRef.current?.clientHeight || 0;
          d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);
        }
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [stateTopoData]);

    // ── Render ────────────────────────────────────────────────────────

    if (!stateTopoData) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#14b8a6] border-t-transparent animate-spin" />
            <p className="text-[10px] text-[#4a4540]">Loading map data...</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        style={{ background: "#050505" }}
        onMouseMove={handleMouseMove}
      >
        <svg ref={svgRef} className="w-full h-full" />

        {/* Empty state overlay */}
        {!graphData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <p className="text-xs text-[#4a4540]">
                Submit data to reveal geographic intelligence
              </p>
            </div>
          </div>
        )}

        {/* County loading indicator */}
        {countiesLoading && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 rounded bg-[#0a0a0a]/90 border border-[#1a1a1a] text-[9px] text-[#4a4540]">
            <div className="w-3 h-3 rounded-full border border-[#14b8a6] border-t-transparent animate-spin" />
            Loading counties...
          </div>
        )}

        {/* Zoom level indicator */}
        {currentZoom > 1.1 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[#0a0a0a]/90 border border-[#1a1a1a] text-[9px] text-[#4a4540]">
            {currentZoom.toFixed(1)}x
          </div>
        )}

        {/* Tooltip */}
        {hoveredFeature && (
          <div
            className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-lg bg-[#0a0a0a]/95 border border-[#2a2a2a] backdrop-blur-sm text-[10px] whitespace-nowrap"
            style={{
              left: tooltipPos.x + 14,
              top: tooltipPos.y - 10,
            }}
          >
            <span className="text-[#f5f0eb] font-medium">{hoveredFeature}</span>
            {hoveredCount > 0 && (
              <span className="text-[#14b8a6] ml-2">
                {hoveredCount} threat{hoveredCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

InteractiveMap.displayName = "InteractiveMap";
export default InteractiveMap;
