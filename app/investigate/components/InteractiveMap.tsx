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
import { FIPS_TO_STATE, STATE_NAMES } from "@/lib/fips-utils";
import type { OverlayId } from "@/lib/overlay-data";
import { STATE_METRICS, METRIC_MAXES, formatPopulation, formatIncome } from "@/lib/overlay-data";
import { US_INTERSTATES } from "@/lib/data/us-interstates";

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
  onStateClick?: (stateAbbr: string) => void;
  selectedState?: string | null;
  activeOverlays?: Set<OverlayId>;
}

export interface InteractiveMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

// ── Component ────────────────────────────────────────────────────────────

const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(
  function InteractiveMap(
    { onStateClick, selectedState, activeOverlays = new Set() },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const projectionRef = useRef<d3.GeoProjection | null>(null);
    const pathRef = useRef<d3.GeoPath<unknown, d3.GeoPermissibleObjects> | null>(null);
    const stateFeaturesRef = useRef<GeoJSON.Feature[]>([]);

    const [stateTopoData, setStateTopoData] = useState<USTopology | null>(null);
    const [countyTopoData, setCountyTopoData] = useState<CountyTopology | null>(null);
    const [countiesLoading, setCountiesLoading] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<{
      feature: string | null;
      stateAbbr: string | null;
    }>({ feature: null, stateAbbr: null });
    const tooltipPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const tooltipRafRef = useRef<number>(0);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [resizeGen, setResizeGen] = useState(0);
    const [lensPos, setLensPos] = useState<{ x: number; y: number } | null>(null);
    const lensTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Clean up lens timer on unmount
    useEffect(() => {
      return () => {
        if (lensTimerRef.current) clearTimeout(lensTimerRef.current);
      };
    }, []);

    function triggerLens(x: number, y: number) {
      if (lensTimerRef.current) clearTimeout(lensTimerRef.current);
      setLensPos({ x, y });
      lensTimerRef.current = setTimeout(() => setLensPos(null), 1050);
    }

    // Neutral default fill: subtle slate gradient based on population
    const maxPopulation = Math.max(
      ...Object.values(STATE_METRICS).map((m) => m.population)
    );

    const defaultFill = useCallback(
      (stateAbbr: string): string => {
        const metrics = STATE_METRICS[stateAbbr];
        if (!metrics) return "#0a0a0a";
        const t = metrics.population / maxPopulation;
        return d3.interpolateRgbBasis(["#0a0a0a", "#141414", "#1e1e1e"])(
          Math.max(0.1, t)
        );
      },
      [maxPopulation]
    );

    // ── Overlay fill logic ─────────────────────────────────────────────

    const getOverlayFill = useCallback(
      (stateAbbr: string): string | null => {
        const metrics = STATE_METRICS[stateAbbr];
        if (!metrics) return null;

        if (activeOverlays.has("employment")) {
          const composite =
            (1 - metrics.unemploymentRate / 10) * 0.6 +
            (metrics.gig_pct / 15) * 0.4;
          const t = Math.max(0, Math.min(1, composite));
          return d3.interpolateRgbBasis(["#052e16", "#22c55e", "#86efac"])(t);
        }
        if (activeOverlays.has("socioeconomic")) {
          const t = Math.max(0, Math.min(1, metrics.povertyRate / 20));
          return d3.interpolateRgbBasis(["#1a1500", "#eab308", "#fef08a"])(t);
        }
        if (activeOverlays.has("population")) {
          const t = metrics.population / maxPopulation;
          return d3.interpolateBlues(Math.max(0.1, t));
        }
        return null;
      },
      [activeOverlays, maxPopulation]
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tooltipPosRef.current = { x, y };
      if (!tooltipRafRef.current) {
        tooltipRafRef.current = requestAnimationFrame(() => {
          setTooltipPos(tooltipPosRef.current);
          tooltipRafRef.current = 0;
        });
      }
    }, []);

    // ── Main D3 render ────────────────────────────────────────────────

    useEffect(() => {
      if (!stateTopoData || !svgRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const svgEl = svgRef.current;

      const topoData = stateTopoData;

      // Double-rAF: first frame commits layout, second frame reads final dimensions
      let cancelled = false;
      const rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (cancelled) return;
          renderMap(container, svgEl);
        });
      });

      function renderMap(container: HTMLDivElement, svgEl: SVGSVGElement) {
      const svg = d3.select(svgEl);
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Guard against zero dimensions (layout not yet settled)
      if (width <= 0 || height <= 0) return;

      svg.attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      // Projection: AlbersUsa (composite with AK/HI insets)
      const stateFeatures = topojson.feature(
        topoData,
        topoData.objects.states
      ).features;
      stateFeaturesRef.current = stateFeatures;

      const projection = d3
        .geoAlbersUsa()
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

      // Overlay layers (between borders and labels)
      g.append("g").attr("class", "overlay-highways");
      g.append("g").attr("class", "overlay-legislation");

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
          if (!stateAbbr) return "#0a0a0a";
          return defaultFill(stateAbbr);
        })
        .attr("stroke", "none")
        .attr("cursor", "pointer")
        .on("mouseenter", function (_, d) {
          const fips = String(d.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          const name = stateAbbr
            ? STATE_NAMES[stateAbbr] || stateAbbr
            : "Unknown";
          setHoverInfo({ feature: name, stateAbbr: stateAbbr || null });
          d3.select(this).attr("stroke", "#14b8a6").attr("stroke-width", 1.5);
        })
        .on("mouseleave", function () {
          setHoverInfo({ feature: null, stateAbbr: null });
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

          // Glass lens at click point (screen-space)
          const transform = d3.zoomTransform(svgEl);
          const screenX = transform.applyX(cx);
          const screenY = transform.applyY(cy);
          triggerLens(screenX, screenY);

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
        topoData,
        topoData.objects.states,
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
          .attr("font-size", 10)
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
        setLensPos(null);
      });
      } // end renderMap

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }, [stateTopoData, defaultFill, onStateClick]);

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

    // ── Update fills when overlays change ──────────────────────────────

    useEffect(() => {
      if (!gRef.current) return;
      gRef.current
        .select(".states")
        .selectAll<SVGPathElement, d3.GeoPermissibleObjects>("path")
        .transition()
        .duration(400)
        .attr("fill", (d) => {
          const feature = d as GeoJSON.Feature & { id?: string | number };
          const fips = String(feature.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          if (!stateAbbr) return "#0a0a0a";
          const overlayFill = getOverlayFill(stateAbbr);
          if (overlayFill) return overlayFill;
          return defaultFill(stateAbbr);
        });
    }, [activeOverlays, getOverlayFill, defaultFill]);

    // ── Metric cluster dots ──────────────────────────────────────────

    useEffect(() => {
      if (!gRef.current || !pathRef.current) return;

      const g = gRef.current;
      const pathGen = pathRef.current;
      const features = stateFeaturesRef.current;

      // Remove old dots
      g.selectAll(".metric-dots").remove();

      // Hide dots when metric-encoding overlays are active
      const metricOverlaysActive =
        activeOverlays.has("population") ||
        activeOverlays.has("socioeconomic") ||
        activeOverlays.has("employment");

      if (metricOverlaysActive || features.length === 0) return;

      // Hide dots when zoomed out too far
      if (currentZoom < 0.5) return;

      // Insert before labels so dots sit below label text in z-order
      const dotsGroup = g.insert("g", ".labels").attr("class", "metric-dots");
      const scale = 1 / Math.sqrt(Math.max(currentZoom, 0.5));

      // Build flat array of all dot data for D3 data-join
      const dotData: { cx: number; cy: number; r: number; color: string }[] = [];

      features.forEach((feature) => {
        const fips = String(feature.id).padStart(2, "0");
        const abbr = FIPS_TO_STATE[fips];
        const metrics = abbr ? STATE_METRICS[abbr] : null;
        if (!metrics || !abbr) return;

        const centroid = pathGen.centroid(feature);
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return;

        const [cx, cy] = centroid;
        const offset = 6 * scale;

        const defs = [
          { dx: 0, dy: -offset, value: metrics.population / METRIC_MAXES.population, color: "#3b82f6" },
          { dx: offset, dy: 0, value: metrics.medianIncome / METRIC_MAXES.medianIncome, color: "#22c55e" },
          { dx: 0, dy: offset, value: metrics.unemploymentRate / METRIC_MAXES.unemploymentRate, color: "#eab308" },
          { dx: -offset, dy: 0, value: metrics.gig_pct / METRIC_MAXES.gig_pct, color: "#14b8a6" },
          { dx: 0, dy: 0, value: metrics.povertyRate / METRIC_MAXES.povertyRate, color: "#f59e0b" },
        ];

        defs.forEach((d) => {
          dotData.push({
            cx: cx + d.dx,
            cy: cy + d.dy,
            r: (1.5 + Math.min(d.value, 1) * 2.5) * scale,
            color: d.color,
          });
        });
      });

      dotsGroup
        .selectAll("circle")
        .data(dotData)
        .join("circle")
        .attr("cx", (d) => d.cx)
        .attr("cy", (d) => d.cy)
        .attr("r", (d) => d.r)
        .attr("fill", (d) => d.color)
        .attr("opacity", 0.85)
        .attr("pointer-events", "none");
    }, [activeOverlays, currentZoom, resizeGen]);

    // ── Update overlay layers (no full re-render) ───────────────────

    useEffect(() => {
      if (!gRef.current || !pathRef.current || !stateTopoData) return;

      const g = gRef.current;
      const path = pathRef.current;

      // Highways
      let highwayGroup = g.select<SVGGElement>(".overlay-highways");
      if (highwayGroup.empty()) {
        highwayGroup = g.insert("g", ".labels").attr("class", "overlay-highways");
      }
      highwayGroup.selectAll("*").remove();
      if (activeOverlays.has("highways")) {
        highwayGroup
          .selectAll("path")
          .data(US_INTERSTATES.features)
          .join("path")
          .attr("d", (d) => {
            const lineString = {
              type: "LineString" as const,
              coordinates: d.geometry.coordinates,
            };
            return path(lineString as d3.GeoPermissibleObjects) || "";
          })
          .attr("fill", "none")
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none")
          .transition()
          .duration(400)
          .attr("stroke-opacity", 0.5);
      }

      // Legislation
      let legislationGroup = g.select<SVGGElement>(".overlay-legislation");
      if (legislationGroup.empty()) {
        legislationGroup = g.insert("g", ".labels").attr("class", "overlay-legislation");
      }
      legislationGroup.selectAll("*").remove();
      if (activeOverlays.has("legislation")) {
        const stateFeatures = topojson.feature(
          stateTopoData,
          stateTopoData.objects.states
        ).features;

        legislationGroup
          .selectAll("path")
          .data(
            stateFeatures.filter((f) => {
              const fips = String(f.id).padStart(2, "0");
              const abbr = FIPS_TO_STATE[fips];
              return abbr && STATE_METRICS[abbr]?.hasActiveLegislation;
            })
          )
          .join("path")
          .attr("d", (d) => path(d) || "")
          .attr("fill", "rgba(239, 68, 68, 0)")
          .attr("stroke", "#ef4444")
          .attr("stroke-width", 2.5)
          .attr("stroke-opacity", 0)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none")
          .transition()
          .duration(400)
          .attr("fill", "rgba(239, 68, 68, 0.1)")
          .attr("stroke-opacity", 1);
      }
    }, [activeOverlays, stateTopoData]);

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

      // Glass lens at centroid (screen-space)
      const centroid = path.centroid(target);
      const transform = d3.zoomTransform(svgRef.current!);
      const screenX = transform.applyX(centroid[0]);
      const screenY = transform.applyY(centroid[1]);
      triggerLens(screenX, screenY);

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
      const container = containerRef.current;

      const observer = new ResizeObserver(() => {
        if (!stateTopoData || !svgRef.current || !gRef.current) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width <= 0 || height <= 0) return;

        const svg = d3.select(svgRef.current);
        svg.attr("width", width).attr("height", height);

        const features = stateFeaturesRef.current;
        if (features.length === 0) return;

        // Rebuild projection for new dimensions
        const projection = d3
          .geoAlbersUsa()
          .fitSize([width, height], {
            type: "FeatureCollection",
            features,
          });
        const path = d3.geoPath().projection(projection);
        projectionRef.current = projection;
        pathRef.current = path;

        const g = gRef.current;

        // Redraw state paths
        g.select(".states")
          .selectAll<SVGPathElement, GeoJSON.Feature>("path")
          .attr("d", (d) => path(d) || "");

        // Redraw state border mesh
        const stateMesh = topojson.mesh(
          stateTopoData,
          stateTopoData.objects.states,
          (a, b) => a !== b
        );
        g.select(".state-borders").select("path").attr("d", path(stateMesh) || "");

        // Redraw labels at new centroid positions
        g.select(".labels").selectAll("text").remove();
        features.forEach((feature) => {
          const fips = String(feature.id).padStart(2, "0");
          const stateAbbr = FIPS_TO_STATE[fips];
          if (!stateAbbr) return;
          const centroid = path.centroid(feature);
          if (isNaN(centroid[0]) || isNaN(centroid[1])) return;
          g.select(".labels")
            .append("text")
            .attr("x", centroid[0])
            .attr("y", centroid[1])
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", 10)
            .attr("fill", "#4a4540")
            .attr("pointer-events", "none")
            .text(stateAbbr);
        });

        // Invalidate metric dots so useEffect redraws with new projection
        g.selectAll(".metric-dots").remove();
        setResizeGen((n) => n + 1);

        // Redraw county paths if loaded
        if (countyTopoData) {
          const countyFeatures = topojson.feature(
            countyTopoData,
            countyTopoData.objects.counties
          ).features;
          g.select(".counties")
            .selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .attr("d", (d) => path(d as d3.GeoPermissibleObjects) || "");
          // If no county paths existed, they'll be drawn by the county effect
          if (g.select(".counties").selectAll("path").empty() && countyFeatures.length > 0) {
            g.select(".counties")
              .selectAll("path")
              .data(countyFeatures)
              .join("path")
              .attr("d", (d) => path(d as d3.GeoPermissibleObjects) || "")
              .attr("fill", "none")
              .attr("stroke", "#1a1a1a")
              .attr("stroke-width", 0.3)
              .attr("vector-effect", "non-scaling-stroke")
              .attr("pointer-events", "none");
          }
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, [stateTopoData, countyTopoData]);

    // ── Render ────────────────────────────────────────────────────────

    if (!stateTopoData) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#14b8a6] border-t-transparent animate-spin" />
            <p className="text-sm text-[#4a4540]">Loading map data...</p>
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

        {/* Glass lens zoom effect */}
        {lensPos && (
          <div
            key={`lens-${lensPos.x}-${lensPos.y}`}
            className="glass-lens"
            style={{ left: lensPos.x, top: lensPos.y }}
          />
        )}

        {/* County loading indicator */}
        {countiesLoading && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 rounded bg-[#0a0a0a]/90 border border-[#1a1a1a] text-xs text-[#4a4540]">
            <div className="w-3 h-3 rounded-full border border-[#14b8a6] border-t-transparent animate-spin" />
            Loading counties...
          </div>
        )}

        {/* Zoom level indicator */}
        {currentZoom > 1.1 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[#0a0a0a]/90 border border-[#1a1a1a] text-xs text-[#4a4540]">
            {currentZoom.toFixed(1)}x
          </div>
        )}

        {/* Tooltip */}
        {hoverInfo.feature && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-[#0a0a0a]/95 border border-[#2a2a2a] backdrop-blur-sm text-sm whitespace-nowrap"
            style={{
              left: tooltipPos.x + 14,
              top: tooltipPos.y - 10,
            }}
          >
            <span className="text-[#f5f0eb] font-medium">{hoverInfo.feature}</span>
            {hoverInfo.stateAbbr && STATE_METRICS[hoverInfo.stateAbbr] && (
              <div className="mt-1 pt-1 border-t border-[#2a2a2a] space-y-0.5 text-xs">
                <div className="text-[#8a8580]">
                  {formatPopulation(STATE_METRICS[hoverInfo.stateAbbr].population)} residents
                </div>
                <div className="text-[#8a8580]">
                  {formatIncome(STATE_METRICS[hoverInfo.stateAbbr].medianIncome)} median income
                </div>
                <div className="text-[#8a8580]">
                  {STATE_METRICS[hoverInfo.stateAbbr].unemploymentRate}% unemployment
                </div>
                {activeOverlays.size > 0 && (
                  <div className="mt-1 pt-1 border-t border-[#2a2a2a] space-y-0.5">
                    {activeOverlays.has("population") && (
                      <div className="text-[#3b82f6]">
                        Pop: {formatPopulation(STATE_METRICS[hoverInfo.stateAbbr].population)}
                      </div>
                    )}
                    {activeOverlays.has("socioeconomic") && (
                      <div className="text-[#eab308]">
                        {STATE_METRICS[hoverInfo.stateAbbr].povertyRate}% poverty
                      </div>
                    )}
                    {activeOverlays.has("employment") && (
                      <div className="text-[#22c55e]">
                        {STATE_METRICS[hoverInfo.stateAbbr].gig_pct}% gig economy
                      </div>
                    )}
                    {activeOverlays.has("legislation") && STATE_METRICS[hoverInfo.stateAbbr].hasActiveLegislation && (
                      <div className="text-[#ef4444]">
                        {STATE_METRICS[hoverInfo.stateAbbr].legislationTopics.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

InteractiveMap.displayName = "InteractiveMap";
export default InteractiveMap;
