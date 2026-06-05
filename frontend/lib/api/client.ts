// frontend/lib/api/client.ts

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function internalFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${FASTAPI_BASE_URL}/internal${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      // FastAPI HTTPException uses `detail`, our envelope uses `error.message`
      message = body?.error?.message ?? body?.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, code, message);
  }

  // All internal endpoints return { data: T } — unwrap here
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Platform auth helpers (server-side only) ─────────────────────────────

export type PlatformUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Register a new platform developer account.
 * Called from the signup server action after Zod validation.
 * Throws ApiError on 409 (duplicate email) or other failures.
 */
export async function platformSignUp(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: PlatformUser }> {
  return internalFetch<{ user: PlatformUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Authenticate a platform developer account.
 * Returns the user object — Auth.js creates the session from this.
 * Throws ApiError on 401 (bad credentials) or 403 (banned).
 */
export async function platformSignIn(params: {
  email: string;
  password: string;
}): Promise<{ user: PlatformUser }> {
  return internalFetch<{ user: PlatformUser }>("/auth/signin", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────

export async function createProject(params: {
  project_id: string;
  name: string;
  db_schema: string;
  mongo_database: string;
}): Promise<{ project_id: string; provisioned: boolean }> {
  return internalFetch<{ project_id: string; provisioned: boolean }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// ─── Usage ────────────────────────────────────────────────────────────────

export async function getProjectUsage(
  projectId: string
): Promise<Record<string, number>> {
  return internalFetch<Record<string, number>>(`/usage/${projectId}`);
}