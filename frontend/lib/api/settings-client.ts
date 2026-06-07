// frontend/lib/api/settings-client.ts
/**
 * Server-side helpers for project settings dashboard.
 * Calls FastAPI /internal/projects/{id}/settings|api-keys|members via X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class SettingsApiError extends Error {
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
    throw new SettingsApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  project_id: string;
  key_type: "anon" | "service";
  label: string;
  is_active: boolean;
  created_at: string;
  key_prefix?: string;
  /** Only present immediately after creation */
  key?: string;
}

export interface ProjectSettings {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: "active" | "paused" | "deleted";
  db_schema: string;
  mongo_database: string;
  created_at: string;
  org_id: string;
  org_name: string;
  org_plan: string;
  owner_id: string;
  description?: string;
}

export interface ProjectMember {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  created_at: string;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function getProjectSettings(projectId: string): Promise<ProjectSettings> {
  return internalFetch<ProjectSettings>(`/projects/${projectId}/settings`);
}

export async function getProjectApiKeys(projectId: string): Promise<{ keys: ApiKey[] }> {
  return internalFetch<{ keys: ApiKey[] }>(`/projects/${projectId}/api-keys`);
}

export async function getProjectMembers(projectId: string): Promise<{ members: ProjectMember[] }> {
  return internalFetch<{ members: ProjectMember[] }>(`/projects/${projectId}/members`);
}