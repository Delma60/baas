// frontend/lib/api/realtime-client.ts
/**
 * Server-side helpers for realtime dashboard operations.
 * Calls FastAPI /internal/projects/{id}/realtime/* using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class RealtimeApiError extends Error {
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
    throw new RealtimeApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface RealtimeChannel {
  id: string;
  name: string;
  path: string;
  access_rule: string;
  is_active: boolean;
  enable_presence: boolean;
  created_at: string;
  /** Connected clients — populated from Redis/Socket.io; 0 if unavailable */
  connected?: number;
}

export interface RealtimeStats {
  total_channels: number;
  active_channels: number;
  presence_channels: number;
  connected_clients: number;
}

export interface RealtimeRules {
  rules_json: string;
  updated_at: string | null;
}

export async function getRealtimeChannels(projectId: string): Promise<RealtimeChannel[]> {
  const result = await internalFetch<{ channels: RealtimeChannel[] }>(
    `/projects/${projectId}/realtime/channels`
  );
  return result.channels ?? [];
}

export async function getRealtimeStats(projectId: string): Promise<RealtimeStats> {
  return internalFetch<RealtimeStats>(`/projects/${projectId}/realtime/stats`);
}

export async function getRealtimeRules(projectId: string): Promise<RealtimeRules> {
  return internalFetch<RealtimeRules>(`/projects/${projectId}/realtime/rules`);
}