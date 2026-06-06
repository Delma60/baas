// frontend/lib/api/client.ts
import type { Project } from "@/types/baas";

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

type BackendProject = {
  id: string;
  name: string;
  status: "active" | "paused" | "deleted";
  region: string;
  created_at: string;
  organization_name?: string;
  slug?: string;
  db_schema?: string;
  mongo_database?: string;
};

function projectIconFromName(name: string): Project["icon"] {
  const lower = name.toLowerCase();
  if (lower.includes("store") || lower.includes("shop")) return "cart";
  if (lower.includes("mobile") || lower.includes("app")) return "mobile";
  if (lower.includes("cms") || lower.includes("content") || lower.includes("blog")) return "article";
  if (lower.includes("analytics") || lower.includes("stats") || lower.includes("dash")) return "chart";
  return "default";
}

function projectColorFromStatus(status: Project["status"]): Project["color"] {
  if (status === "paused") return "purple";
  return "orange";
}

function mapBackendProject(project: BackendProject): Project {
  return {
    id: project.id,
    name: project.name,
    organizationName: project.organization_name ?? "Personal",
    status: project.status,
    region: project.region ?? "Lagos",
    icon: projectIconFromName(project.name),
    color: projectColorFromStatus(project.status),
    modules: ["sql", "nosql", "auth", "storage", "realtime", "ai", "functions"] as const,
    sqlRows: 0,
    apiCalls: 0,
    updatedAt: new Date(project.created_at),
  };
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

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
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
  organizationName?: string;
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

/**
 * Get projects for a specific user. Always pass userId to filter by owner.
 */
export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const projects = await internalFetch<BackendProject[]>(
    `/users/${userId}/projects`
  );
  return projects.map(mapBackendProject);
}

/**
 * @deprecated Use getProjectsByUser(userId) instead.
 * Returns all projects (no user filter) — only useful for superadmin.
 */
export async function getProjects(): Promise<Project[]> {
  const projects = await internalFetch<BackendProject[]>("/projects");
  return projects.map(mapBackendProject);
}

export async function getProjectById(projectId: string): Promise<Project> {
  const project = await internalFetch<BackendProject>(`/projects/${projectId}`);
  return mapBackendProject(project);
}

export async function createProject(params: {
  project_id: string;
  name: string;
  region: string;
  db_schema: string;
  mongo_database: string;
  owner_user_id: string;
  description?: string;
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