// frontend/lib/api/auth-client.ts
/**
 * Server-side helpers for per-project auth user management.
 * Calls FastAPI /internal/projects/{id}/auth/* endpoints using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class AuthApiError extends Error {
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
    throw new AuthApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthStats {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  new_last_30d: number;
  new_last_7d: number;
}

export interface AuthUsersResult {
  users: AuthUser[];
  total: number;
}

export async function getAuthUsers(
  projectId: string,
  dbSchema: string,
  opts: { limit?: number; offset?: number; search?: string } = {}
): Promise<AuthUsersResult> {
  const params = new URLSearchParams({ db_schema: dbSchema });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.search) params.set("search", opts.search);

  return internalFetch<AuthUsersResult>(
    `/projects/${projectId}/auth/users?${params}`
  );
}

export async function getAuthStats(
  projectId: string,
  dbSchema: string
): Promise<AuthStats> {
  return internalFetch<AuthStats>(
    `/projects/${projectId}/auth/stats?db_schema=${encodeURIComponent(dbSchema)}`
  );
}