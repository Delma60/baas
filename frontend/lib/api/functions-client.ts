// frontend/lib/api/functions-client.ts
/**
 * Server-side helpers for edge functions dashboard operations.
 * Calls FastAPI /internal/projects/{id}/functions/* using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class FunctionsApiError extends Error {
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
    throw new FunctionsApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface EdgeFunction {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  endpoint_url: string;
  method: string;
  timeout_ms: number;
  is_active: boolean;
  invoke_count: number;
  last_invoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunctionStats {
  total: number;
  active: number;
  inactive: number;
  total_invocations: number;
}

export interface FunctionLog {
  id: string;
  function_name: string;
  status_code: number | null;
  duration_ms: number | null;
  request_payload: string | null;
  response_body: string | null;
  error: string | null;
  created_at: string;
}

export async function getFunctions(
  projectId: string
): Promise<{ functions: EdgeFunction[]; total: number }> {
  return internalFetch(`/projects/${projectId}/functions`);
}

export async function getFunctionStats(projectId: string): Promise<FunctionStats> {
  return internalFetch(`/projects/${projectId}/functions/stats`);
}

export async function getFunctionLogs(
  projectId: string,
  functionId: string
): Promise<{ logs: FunctionLog[] }> {
  return internalFetch(`/projects/${projectId}/functions/${functionId}/logs`);
}