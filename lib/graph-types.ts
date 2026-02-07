// TypeScript interfaces matching PhishGuard Intel backend graph response format

export type NodeType =
  | "domain"
  | "ip"
  | "phone"
  | "email"
  | "registrant"
  | "nameserver"
  | "ssl_cert"
  | "carrier"
  | "campaign"
  | "region";

export type Relationship =
  | "resolves_to"
  | "uses_nameserver"
  | "registered_by"
  | "has_certificate"
  | "carrier"
  | "uses_domain"
  | "related_to"
  | "located_in";

export type RiskLevel = "minimal" | "low" | "medium" | "high";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  risk_factors?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: Relationship;
  evidence?: string[];
  confidence?: number;
}

export interface PivotPoint {
  node: string;
  type: NodeType;
  in_degree: number;
  out_degree: number;
  total_connections: number;
  neighbors: string[];
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  clusters: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
  clusters: string[][];
  pivot_points: PivotPoint[];
}

export interface ExtractionResponse {
  urls: Array<{ url: string; domain: string }>;
  domains: string[];
  phones: Array<{ raw: string; e164: string }>;
  emails: string[];
  scam_indicators: Record<string, string[]>;
  risk_assessment: Record<string, string>;
}

export interface DomainEnrichment {
  domain: string;
  dns: {
    A?: string[];
    AAAA?: string[];
    NS?: string[];
    MX?: string[];
    TXT?: string[];
    CNAME?: string[];
  };
  whois: {
    registrar?: string;
    creation_date?: string;
    expiration_date?: string;
    registrant?: string;
    name_servers?: string[];
    status?: string[];
  };
  ssl: {
    subject?: Record<string, string>;
    issuer?: Record<string, string>;
    not_before?: string;
    not_after?: string;
    fingerprint_sha256?: string;
  };
  reverse_dns?: Record<string, string>;
  risk: {
    risk_score: number;
    risk_level: RiskLevel;
    risk_factors: string[];
  };
}

// D3 simulation types (extended for force layout)
export interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  degree?: number;
}

export interface SimulationEdge {
  source: string | SimulationNode;
  target: string | SimulationNode;
  relationship: Relationship;
  evidence?: string[];
  confidence?: number;
}

// Node color map matching backend
export const NODE_COLORS: Record<NodeType, string> = {
  domain: "#3498db",
  ip: "#e74c3c",
  phone: "#2ecc71",
  email: "#9b59b6",
  registrant: "#f39c12",
  nameserver: "#1abc9c",
  ssl_cert: "#7f8c8d",
  carrier: "#95a5a6",
  campaign: "#e91e63",
  region: "#e67e22",
};

export const NODE_LABELS: Record<NodeType, string> = {
  domain: "Domain",
  ip: "IP Address",
  phone: "Phone",
  email: "Email",
  registrant: "Registrant",
  nameserver: "Nameserver",
  ssl_cert: "SSL Cert",
  carrier: "Carrier",
  campaign: "Campaign",
  region: "Region",
};
