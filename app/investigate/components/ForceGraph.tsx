"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type {
  GraphResponse,
  SimulationNode,
  SimulationEdge,
  NodeType,
} from "@/lib/graph-types";
import { NODE_COLORS } from "@/lib/graph-types";

interface ForceGraphProps {
  data: GraphResponse;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  width?: number;
  height?: number;
}

function nodeRadius(degree: number, riskScore?: number): number {
  const base = 6 + Math.min(degree, 10) * 2;
  if (riskScore && riskScore >= 70) return base + 4;
  return base;
}

function nodeGlow(riskScore?: number): string {
  if (!riskScore || riskScore < 40) return "none";
  const color = riskScore >= 70 ? "#e74c3c" : "#f39c12";
  const radius = riskScore >= 70 ? 12 : 6;
  return `drop-shadow(0 0 ${radius}px ${color})`;
}

function typeIcon(type: NodeType): string {
  const icons: Record<NodeType, string> = {
    domain: "\uf0ac",   // globe
    ip: "\uf233",       // server
    phone: "\uf095",    // phone
    email: "\uf0e0",    // envelope
    registrant: "\uf007", // user
    nameserver: "\uf1c0", // database
    ssl_cert: "\uf023",  // lock
    carrier: "\uf012",   // signal
    campaign: "\uf071",  // warning
  };
  return icons[type] || "\uf111";
}

export default function ForceGraph({
  data,
  onNodeClick,
  selectedNodeId,
  width: containerWidth,
  height: containerHeight,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId);
    },
    [onNodeClick]
  );

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = containerWidth || container?.clientWidth || 800;
    const height = containerHeight || container?.clientHeight || 600;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    // Defs for arrowheads and filters
    const defs = svg.append("defs");

    // Arrowhead marker
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4a4540");

    // Glow filter
    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Prepare node degree map
    const degreeMap = new Map<string, number>();
    data.edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    // Build simulation data
    const nodes: SimulationNode[] = data.nodes.map((n) => ({
      ...n,
      degree: degreeMap.get(n.id) || 0,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const edges: SimulationEdge[] = data.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ ...e }));

    // Pivot point IDs for emphasis
    const pivotIds = new Set(data.pivot_points.map((p) => p.node));

    // Create zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Edge layer
    const linkGroup = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#2a2a2a")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrow)");

    // Edge labels (relationship type)
    const edgeLabelGroup = g
      .append("g")
      .attr("class", "edge-labels")
      .selectAll("text")
      .data(edges)
      .join("text")
      .text((d) => d.relationship.replace(/_/g, " "))
      .attr("font-size", 8)
      .attr("fill", "#4a4540")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .style("pointer-events", "none");

    // Node group
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_event, d) => handleNodeClick(d.id));

    // Node circles
    nodeGroup
      .append("circle")
      .attr("r", (d) => nodeRadius(d.degree || 0, d.risk_score))
      .attr("fill", (d) => NODE_COLORS[d.type] || "#666")
      .attr("fill-opacity", 0.85)
      .attr("stroke", (d) =>
        d.id === selectedNodeId
          ? "#5eead4"
          : pivotIds.has(d.id)
          ? "#f5f0eb"
          : NODE_COLORS[d.type] || "#666"
      )
      .attr("stroke-width", (d) =>
        d.id === selectedNodeId ? 3 : pivotIds.has(d.id) ? 2 : 1.5
      )
      .attr("stroke-opacity", 0.9)
      .attr("filter", (d) =>
        (d.risk_score && d.risk_score >= 40) ? "url(#glow)" : null
      );

    // Node labels
    nodeGroup
      .append("text")
      .text((d) => {
        const label = d.label;
        return label.length > 20 ? label.slice(0, 18) + "..." : label;
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d.degree || 0, d.risk_score) + 14)
      .attr("font-size", 10)
      .attr("fill", "#8a8580")
      .attr("font-family", "DM Sans, system-ui, sans-serif")
      .style("pointer-events", "none");

    // Type badge (small icon text above)
    nodeGroup
      .append("text")
      .text((d) => d.type.replace(/_/g, " "))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -(nodeRadius(d.degree || 0, d.risk_score) + 6))
      .attr("font-size", 7)
      .attr("fill", "#4a4540")
      .attr("font-family", "DM Sans, system-ui, sans-serif")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "0.08em")
      .style("pointer-events", "none");

    // Drag behavior
    function dragStarted(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>,
      d: SimulationNode
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>,
      d: SimulationNode
    ) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>,
      d: SimulationNode
    ) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    nodeGroup.call(
      d3
        .drag<SVGGElement, SimulationNode>()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    );

    // Tooltip on hover
    nodeGroup
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 3);

        // Highlight connected edges
        linkGroup
          .attr("stroke", (l) => {
            const s =
              typeof l.source === "string" ? l.source : (l.source as SimulationNode).id;
            const t =
              typeof l.target === "string" ? l.target : (l.target as SimulationNode).id;
            return s === d.id || t === d.id ? "#5eead4" : "#2a2a2a";
          })
          .attr("stroke-width", (l) => {
            const s =
              typeof l.source === "string" ? l.source : (l.source as SimulationNode).id;
            const t =
              typeof l.target === "string" ? l.target : (l.target as SimulationNode).id;
            return s === d.id || t === d.id ? 2.5 : 1.5;
          });
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("fill-opacity", 0.85)
          .attr(
            "stroke-width",
            d.id === selectedNodeId ? 3 : pivotIds.has(d.id) ? 2 : 1.5
          );

        linkGroup.attr("stroke", "#2a2a2a").attr("stroke-width", 1.5);
      });

    // Force simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationEdge>(edges)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))
      .on("tick", () => {
        linkGroup
          .attr("x1", (d) => (d.source as SimulationNode).x!)
          .attr("y1", (d) => (d.source as SimulationNode).y!)
          .attr("x2", (d) => (d.target as SimulationNode).x!)
          .attr("y2", (d) => (d.target as SimulationNode).y!);

        edgeLabelGroup
          .attr(
            "x",
            (d) =>
              ((d.source as SimulationNode).x! +
                (d.target as SimulationNode).x!) /
              2
          )
          .attr(
            "y",
            (d) =>
              ((d.source as SimulationNode).y! +
                (d.target as SimulationNode).y!) /
              2
          );

        nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0) {
        const dx = bounds.width + 80;
        const dy = bounds.height + 80;
        const x = bounds.x - 40;
        const y = bounds.y - 40;
        const scale = Math.min(
          0.9,
          Math.min(width / dx, height / dy)
        );
        const translate: [number, number] = [
          width / 2 - scale * (x + dx / 2),
          height / 2 - scale * (y + dy / 2),
        ];
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
      }
    }, 1500);

    return () => {
      simulation.stop();
    };
  }, [data, selectedNodeId, containerWidth, containerHeight, handleNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
