// frontend/lib/api/client.ts

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

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
  if (!INTERNAL_SECRET) {
    console.error(
      "[api/client] INTERNAL_API_SECRET is not set. " +
        "Add it to frontend/.env — it must match the backend INTERNAL_API_SECRET."
    );
    throw new ApiError(
      500,
      "MISCONFIGURATION",
      "Server is misconfigured: missing INTERNAL_API_SECRET."
    );
  }
  
  const url = `${FASTAPI_BASE_URL}/internal${path}`;
  console.log(url)

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
        ...(init.headers ?? {}),
      },
    });
  } catch (networkErr) {
    console.error("[api/client] Network error reaching FastAPI:", networkErr);
    throw new ApiError(
      503,
      "NETWORK_ERROR",
      `Cannot reach backend at ${FASTAPI_BASE_URL}. Is it running?`
    );
  }

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      code =
        body?.error?.code ??
        body?.detail?.toString().toUpperCase().replace(/[^A-Z0-9_]+/g, "_") ??
        code;
      message = body?.error?.message ?? body?.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, code, message);
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Platform auth helpers (server-side only) ─────────────────────────────

export type PlatformUser = {
  id: string;
  email: string;
  name: string;
};

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