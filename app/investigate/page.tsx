"use client";

import { useState, useMemo, useRef } from "react";
import { Shield, AlertTriangle, Map as MapIcon, GitFork } from "lucide-react";
import type { GraphResponse, GraphNode, NodeType } from "@/lib/graph-types";
import type { OverlayId } from "@/lib/overlay-data";
import { buildGraph } from "@/lib/phishguard-api";
import { enrichPhone, getStateStats } from "@/lib/geo-utils";
import ForceGraph from "./components/ForceGraph";
import NodeDetail from "./components/NodeDetail";
import MessageInput from "./components/MessageInput";
import GraphControls from "./components/GraphControls";
import InteractiveMap from "./components/InteractiveMap";
import MapControls from "./components/MapControls";
import type { InteractiveMapHandle } from "./components/InteractiveMap";

export default function InvestigatePage() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Viz mode: map (primary) or graph (secondary)
  const [vizMode, setVizMode] = useState<"map" | "graph">("map");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isTilted, setIsTilted] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayId>>(new Set());

  const mapRef = useRef<InteractiveMapHandle>(null);

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

  const selectedNode = useMemo(() => {
    if (!graphData || !selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graphData, selectedNodeId]);

  const activeTypes = useMemo(() => {
    if (!graphData) return new Set<NodeType>();
    return new Set(graphData.nodes.map((n) => n.type));
  }, [graphData]);

  const stateStats = useMemo(() => {
    if (!graphData) return new Map<string, number>();
    const phones = graphData.nodes
      .filter((n) => n.type === "phone")
      .map((n) => n.label);
    return getStateStats(phones);
  }, [graphData]);

  async function handleSubmit(params: {
    domains: string[];
    phones: string[];
    emails: string[];
    enrich: boolean;
    rawMessage?: string;
  }) {
    setLoading(true);
    setError(null);
    setSelectedNodeId(null);

    try {
      const result = await buildGraph({
        domains: params.domains,
        phones: params.phones,
        emails: params.emails,
        enrich: params.enrich,
      });
      setGraphData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to build graph";
      setError(msg);

      // If backend is unavailable, show demo data
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setGraphData(getDemoData(params.domains, params.phones, params.emails));
        setError("Backend unavailable. Showing demo visualization.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNodeClick(nodeId: string) {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
  }

  function handleStateClick(stateAbbr: string) {
    if (!stateAbbr) {
      setSelectedState(null);
      return;
    }
    setSelectedState(stateAbbr === selectedState ? null : stateAbbr);
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#050505]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-[#f5f0eb] hover:text-[#14b8a6] transition-colors"
          >
            <Shield className="w-5 h-5 text-[#14b8a6]" />
            <span className="text-base font-semibold tracking-tight">
              PhishGuard
            </span>
          </a>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <span className="text-xs text-[#4a4540] uppercase tracking-[0.15em] font-medium">
            Infrastructure Graph
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="/"
            className="text-[13px] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
          >
            Home
          </a>
          <a
            href="/investigate"
            className="text-[13px] text-[#14b8a6]"
          >
            Investigate
          </a>
          <span className="text-[13px] text-[#4a4540] cursor-default" title="Coming soon">
            Intel
          </span>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Input */}
        <aside className="w-72 shrink-0 border-r border-[#1a1a1a] bg-[#050505] overflow-y-auto">
          <MessageInput onSubmit={handleSubmit} loading={loading} />
        </aside>

        {/* Center - Visualization */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#1a1a1a] bg-[#050505]">
            <TabButton
              active={vizMode === "map"}
              onClick={() => setVizMode("map")}
              icon={<MapIcon className="w-3 h-3" />}
              label="Map"
            />
            <TabButton
              active={vizMode === "graph"}
              onClick={() => setVizMode("graph")}
              icon={<GitFork className="w-3 h-3" />}
              label="Graph"
            />
            {vizMode === "map" && stateStats.size > 0 && (
              <span className="ml-auto text-xs text-[#4a4540]">
                <span className="text-[#e67e22] font-medium">{stateStats.size}</span> states
              </span>
            )}
          </div>

          {/* Viz area */}
          <div
            className="flex-1 relative min-h-0"
            style={
              vizMode === "map" && isTilted
                ? {
                    transform: "perspective(1200px) rotateX(20deg)",
                    transformOrigin: "center center",
                  }
                : undefined
            }
          >
            {error && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            {vizMode === "map" ? (
              <InteractiveMap
                ref={mapRef}
                stateStats={stateStats}
                graphData={graphData}
                onStateClick={handleStateClick}
                selectedState={selectedState}
                activeOverlays={activeOverlays}
              />
            ) : graphData ? (
              <ForceGraph
                data={graphData}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNodeId}
              />
            ) : (
              <EmptyState loading={loading} />
            )}
          </div>

          {/* Bottom controls */}
          <div className="shrink-0">
            {vizMode === "map" ? (
              <MapControls
                stats={graphData?.stats || null}
                pivotPoints={graphData?.pivot_points || []}
                activeTypes={activeTypes}
                stateStats={stateStats}
                onZoomIn={() => mapRef.current?.zoomIn()}
                onZoomOut={() => mapRef.current?.zoomOut()}
                onReset={() => {
                  mapRef.current?.resetZoom();
                  setSelectedState(null);
                }}
                onToggleTilt={() => setIsTilted((v) => !v)}
                isTilted={isTilted}
                selectedState={selectedState}
                onClearState={() => {
                  setSelectedState(null);
                  mapRef.current?.resetZoom();
                }}
                activeOverlays={activeOverlays}
                onToggleOverlay={handleToggleOverlay}
              />
            ) : graphData ? (
              <GraphControls
                stats={graphData.stats}
                pivotPoints={graphData.pivot_points}
                activeTypes={activeTypes}
              />
            ) : null}
          </div>
        </main>

        {/* Right panel - Node Detail */}
        {selectedNode && graphData && (
          <aside className="w-80 shrink-0 border-l border-[#1a1a1a] bg-[#050505] overflow-y-auto">
            <NodeDetail
              node={selectedNode}
              edges={graphData.edges}
              allNodes={graphData.nodes}
              onNodeNavigate={handleNodeClick}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// ── Tab Button ──────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
        active
          ? "bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20"
          : "text-[#4a4540] hover:text-[#8a8580] border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        {loading ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#14b8a6] border-t-transparent animate-spin" />
            <p className="text-sm text-[#8a8580]">
              Building infrastructure graph...
            </p>
            <p className="text-xs text-[#4a4540]">
              Enriching domains, resolving DNS, checking SSL...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#14b8a6]/40" />
            </div>
            <div>
              <p className="text-sm text-[#8a8580]">
                Paste a suspicious message or enter domains to investigate
              </p>
              <p className="text-xs text-[#4a4540] mt-1">
                PhishGuard will map the infrastructure graph and reveal
                connections
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Demo Data ───────────────────────────────────────────────────────────

/** Demo data for when backend is unavailable */
function getDemoData(
  domains: string[],
  phones: string[],
  emails: string[]
): GraphResponse {
  const nodes: GraphNode[] = [];
  const edges: GraphResponse["edges"] = [];

  // Create domain nodes
  domains.forEach((d) => {
    nodes.push({
      id: `domain:${d}`,
      type: "domain",
      label: d,
      risk_score: 65 + Math.floor(Math.random() * 30),
      risk_level: "high",
      risk_factors: ["newly_registered", "privacy_protected_whois"],
    });

    // Create associated IP
    const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(
      Math.random() * 255
    )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    nodes.push({
      id: `ip:${ip}`,
      type: "ip",
      label: ip,
      risk_score: 40,
      risk_level: "medium",
    });
    edges.push({
      source: `domain:${d}`,
      target: `ip:${ip}`,
      relationship: "resolves_to",
      evidence: ["DNS A record"],
    });

    // Create nameserver
    const ns = `ns1.shady-hosting.com`;
    if (!nodes.find((n) => n.id === `ns:${ns}`)) {
      nodes.push({
        id: `ns:${ns}`,
        type: "nameserver",
        label: ns,
      });
    }
    edges.push({
      source: `domain:${d}`,
      target: `ns:${ns}`,
      relationship: "uses_nameserver",
    });

    // Create registrant (shared across domains)
    const reg = "Privacy Protect LLC";
    if (!nodes.find((n) => n.id === `reg:${reg}`)) {
      nodes.push({
        id: `reg:${reg}`,
        type: "registrant",
        label: reg,
        risk_score: 50,
        risk_level: "medium",
        risk_factors: ["privacy_proxy"],
      });
    }
    edges.push({
      source: `domain:${d}`,
      target: `reg:${reg}`,
      relationship: "registered_by",
    });
  });

  // Phone nodes with geographic enrichment
  phones.forEach((p) => {
    const phoneGeo = enrichPhone(p);
    const riskFactors = ["voip_number"];
    if (phoneGeo.geo) {
      riskFactors.push(
        `area_code_${phoneGeo.areaCode}_${phoneGeo.geo.majorCities[0]?.toLowerCase().replace(/\s/g, "_") || phoneGeo.geo.state.toLowerCase()}`
      );
    }
    if (phoneGeo.isTollFree) {
      riskFactors.push("toll_free_nationwide");
    }

    nodes.push({
      id: `phone:${p}`,
      type: "phone",
      label: p,
      risk_score: 55,
      risk_level: "medium",
      risk_factors: riskFactors,
    });

    const carrier = "VoIP Provider";
    if (!nodes.find((n) => n.id === `carrier:${carrier}`)) {
      nodes.push({
        id: `carrier:${carrier}`,
        type: "carrier",
        label: carrier,
      });
    }
    edges.push({
      source: `phone:${p}`,
      target: `carrier:${carrier}`,
      relationship: "carrier",
    });

    // Create region node for geographic connection
    if (phoneGeo.geo) {
      const regionId = `region:${phoneGeo.geo.state}`;
      if (!nodes.find((n) => n.id === regionId)) {
        nodes.push({
          id: regionId,
          type: "region",
          label: `${phoneGeo.geo.stateName} (${phoneGeo.geo.state})`,
        });
      }
      edges.push({
        source: `phone:${p}`,
        target: regionId,
        relationship: "located_in",
        evidence: [`Area code ${phoneGeo.areaCode}: ${phoneGeo.geo.region}`],
      });
    }
  });

  // Email nodes
  emails.forEach((e) => {
    nodes.push({
      id: `email:${e}`,
      type: "email",
      label: e,
    });
    const emailDomain = e.split("@")[1];
    if (emailDomain) {
      const domainNode = nodes.find(
        (n) => n.id === `domain:${emailDomain}`
      );
      if (domainNode) {
        edges.push({
          source: `email:${e}`,
          target: `domain:${emailDomain}`,
          relationship: "uses_domain",
        });
      }
    }
  });

  const clusters = [nodes.map((n) => n.id)];

  return {
    nodes,
    edges,
    stats: {
      node_count: nodes.length,
      edge_count: edges.length,
      clusters: clusters.length,
    },
    clusters,
    pivot_points: domains.length > 0
      ? [
          {
            node: `domain:${domains[0]}`,
            type: "domain",
            in_degree: 0,
            out_degree: 3,
            total_connections: 3,
            neighbors: [],
          },
        ]
      : [],
  };
}
