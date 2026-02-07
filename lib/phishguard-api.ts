import type {
  GraphResponse,
  ExtractionResponse,
  DomainEnrichment,
} from "./graph-types";

const INTEL_API_URL =
  process.env.NEXT_PUBLIC_INTEL_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${INTEL_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function buildGraph(params: {
  domains?: string[];
  phones?: string[];
  emails?: string[];
  enrich?: boolean;
}): Promise<GraphResponse> {
  return apiFetch<GraphResponse>("/graphs/build", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getSubgraph(
  nodeId: string,
  depth: number = 2
): Promise<GraphResponse> {
  return apiFetch<GraphResponse>("/graphs/subgraph", {
    method: "POST",
    body: JSON.stringify({ node_id: nodeId, depth }),
  });
}

export async function extractArtifacts(
  content: string,
  source: string = "user_input"
): Promise<ExtractionResponse> {
  return apiFetch<ExtractionResponse>("/artifacts/extract", {
    method: "POST",
    body: JSON.stringify({ content, source }),
  });
}

export async function enrichDomain(
  domain: string
): Promise<DomainEnrichment> {
  return apiFetch<DomainEnrichment>("/enrich/domain", {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
}

export async function getCentrality(params: {
  domains?: string[];
  phones?: string[];
  emails?: string[];
}): Promise<Array<{ node: string; centrality: number }>> {
  return apiFetch("/graphs/centrality", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
