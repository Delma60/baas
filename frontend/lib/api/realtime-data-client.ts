// frontend/lib/api/realtime-data-client.ts
/**
 * Server-side helpers for realtime database data.
 * Calls FastAPI /internal/projects/{id}/rtdb/* using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class RtdbApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function internalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${FASTAPI_BASE_URL}/internal${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b?.detail ?? b?.error?.message ?? msg;
    } catch {}
    throw new RtdbApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface RtdbTree {
  [key: string]: RtdbNode | RtdbLeaf;
}

export interface RtdbLeaf {
  __value__: unknown;
  __type__: string;
}

export interface RtdbDataResult {
  tree: RtdbTree;
  path: string;
  count: number;
}

export interface RtdbStats {
  total_nodes: number;
  project_id: string;
}

export interface RtdbNode {
    [key:string]: unknown
}

export async function getRtdbData(
  projectId: string,
  mongoDatabase: string,
  path = "/"
): Promise<RtdbDataResult> {
  const params = new URLSearchParams({ mongo_database: mongoDatabase, path });
  return internalFetch<RtdbDataResult>(
    `/projects/${projectId}/rtdb/data?${params}`
  );
}

export async function getRtdbStats(
  projectId: string,
  mongoDatabase: string
): Promise<RtdbStats> {
  const params = new URLSearchParams({ mongo_database: mongoDatabase });
  return internalFetch<RtdbStats>(
    `/projects/${projectId}/rtdb/stats?${params}`
  );
}