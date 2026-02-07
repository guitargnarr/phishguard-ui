"use client";

import { useState } from "react";
import {
  Globe,
  Server,
  Phone,
  Mail,
  User,
  Database,
  Lock,
  Radio,
  AlertTriangle,
  ChevronRight,
  Shield,
  Expand,
  Loader2,
} from "lucide-react";
import type {
  GraphNode,
  GraphEdge,
  NodeType,
  DomainEnrichment,
} from "@/lib/graph-types";
import { NODE_COLORS, NODE_LABELS } from "@/lib/graph-types";
import { enrichDomain, getSubgraph } from "@/lib/phishguard-api";

interface NodeDetailProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onExpand?: (nodeId: string) => void;
  onNodeNavigate?: (nodeId: string) => void;
}

const TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  domain: <Globe className="w-4 h-4" />,
  ip: <Server className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  registrant: <User className="w-4 h-4" />,
  nameserver: <Database className="w-4 h-4" />,
  ssl_cert: <Lock className="w-4 h-4" />,
  carrier: <Radio className="w-4 h-4" />,
  campaign: <AlertTriangle className="w-4 h-4" />,
};

function RiskBadge({ score, level }: { score?: number; level?: string }) {
  if (!score && score !== 0) return null;

  const colors: Record<string, string> = {
    minimal: "bg-green-500/20 text-green-400 border-green-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          colors[level || "minimal"]
        }`}
      >
        {(level || "minimal").toUpperCase()} ({score}/100)
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background:
              score >= 70
                ? "#e74c3c"
                : score >= 40
                ? "#f39c12"
                : "#14b8a6",
          }}
        />
      </div>
    </div>
  );
}

export default function NodeDetail({
  node,
  edges,
  allNodes,
  onExpand,
  onNodeNavigate,
}: NodeDetailProps) {
  const [enrichment, setEnrichment] = useState<DomainEnrichment | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  const connectedNodeIds = new Set(
    connectedEdges.flatMap((e) => [e.source, e.target]).filter((id) => id !== node.id)
  );

  const connectedNodes = allNodes.filter((n) => connectedNodeIds.has(n.id));

  async function handleEnrich() {
    if (node.type !== "domain") return;
    setEnriching(true);
    setEnrichError(null);
    try {
      const data = await enrichDomain(node.label);
      setEnrichment(data);
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  }

  async function handleExpand() {
    setExpanding(true);
    try {
      await getSubgraph(node.id, 2);
      onExpand?.(node.id);
    } catch {
      // Expand failed silently
    } finally {
      setExpanding(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: NODE_COLORS[node.type] + "30" }}
          >
            <span style={{ color: NODE_COLORS[node.type] }}>
              {TYPE_ICONS[node.type]}
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#4a4540]">
              {NODE_LABELS[node.type]}
            </p>
            <p className="text-sm font-medium text-[#f5f0eb] break-all font-mono">
              {node.label}
            </p>
          </div>
        </div>

        <RiskBadge score={node.risk_score} level={node.risk_level} />

        {node.risk_factors && node.risk_factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#4a4540]">
              Risk Factors
            </p>
            <div className="flex flex-wrap gap-1">
              {node.risk_factors.map((factor, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] rounded bg-[#1a1a1a] text-[#8a8580] border border-[#2a2a2a]"
                >
                  {factor.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {node.type === "domain" && !enrichment && (
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20 hover:bg-[#14b8a6]/20 transition-colors disabled:opacity-50"
          >
            {enriching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
            Enrich
          </button>
        )}
        <button
          onClick={handleExpand}
          disabled={expanding}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#1a1a1a] text-[#8a8580] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
        >
          {expanding ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Expand className="w-3 h-3" />
          )}
          Expand
        </button>
      </div>

      {enrichError && (
        <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
          {enrichError}
        </p>
      )}

      {/* Enrichment Data */}
      {enrichment && (
        <div className="space-y-3">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />

          {enrichment.whois.registrar && (
            <DetailSection title="WHOIS">
              <DetailRow label="Registrar" value={enrichment.whois.registrar} />
              {enrichment.whois.registrant && (
                <DetailRow label="Registrant" value={enrichment.whois.registrant} />
              )}
              {enrichment.whois.creation_date && (
                <DetailRow
                  label="Created"
                  value={new Date(enrichment.whois.creation_date).toLocaleDateString()}
                />
              )}
              {enrichment.whois.expiration_date && (
                <DetailRow
                  label="Expires"
                  value={new Date(enrichment.whois.expiration_date).toLocaleDateString()}
                />
              )}
            </DetailSection>
          )}

          {enrichment.dns.A && enrichment.dns.A.length > 0 && (
            <DetailSection title="DNS Records">
              {enrichment.dns.A.map((ip) => (
                <DetailRow key={ip} label="A" value={ip} mono />
              ))}
              {enrichment.dns.NS?.map((ns) => (
                <DetailRow key={ns} label="NS" value={ns} mono />
              ))}
              {enrichment.dns.MX?.map((mx) => (
                <DetailRow key={mx} label="MX" value={mx} mono />
              ))}
            </DetailSection>
          )}

          {enrichment.ssl.issuer && (
            <DetailSection title="SSL Certificate">
              <DetailRow
                label="Issuer"
                value={enrichment.ssl.issuer.commonName || "Unknown"}
              />
              {enrichment.ssl.fingerprint_sha256 && (
                <DetailRow
                  label="SHA256"
                  value={enrichment.ssl.fingerprint_sha256.slice(0, 16) + "..."}
                  mono
                />
              )}
              {enrichment.ssl.not_after && (
                <DetailRow
                  label="Expires"
                  value={new Date(enrichment.ssl.not_after).toLocaleDateString()}
                />
              )}
            </DetailSection>
          )}
        </div>
      )}

      {/* Connected Nodes */}
      <div className="space-y-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#4a4540]">
          Connected ({connectedNodes.length})
        </p>
        <div className="space-y-1">
          {connectedNodes.map((cn) => {
            const edge = connectedEdges.find(
              (e) => e.source === cn.id || e.target === cn.id
            );
            return (
              <button
                key={cn.id}
                onClick={() => onNodeNavigate?.(cn.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left group"
              >
                <span style={{ color: NODE_COLORS[cn.type] }}>
                  {TYPE_ICONS[cn.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#f5f0eb] truncate">{cn.label}</p>
                  {edge && (
                    <p className="text-[9px] text-[#4a4540]">
                      {edge.relationship.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-3 h-3 text-[#4a4540] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
          {connectedNodes.length === 0 && (
            <p className="text-xs text-[#4a4540] italic">No connections</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#4a4540]">
        {title}
      </p>
      <div className="space-y-1 bg-[#0a0a0a] rounded-lg p-2 border border-[#1a1a1a]">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] text-[#4a4540] shrink-0">{label}</span>
      <span
        className={`text-[11px] text-[#8a8580] text-right break-all ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
