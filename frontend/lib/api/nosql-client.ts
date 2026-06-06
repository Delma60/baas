// frontend/lib/api/nosql-client.ts
/**
 * Server-side helpers for NoSQL / KV operations.
 * These call the FastAPI /v1/nosql/* endpoints via the internal proxy pattern,
 * using the INTERNAL_API_SECRET + a project service-role API key.
 *
 * For the dashboard we call /v1/nosql/* with a service key fetched
 * from the internal endpoint, so we can browse all collections/docs.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class NoSQLApiError extends Error {
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
    throw new NoSQLApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

/**
 * Lists all non-reserved collection names for a project's MongoDB database.
 * Uses the internal endpoint that reads MongoDB metadata.
 */
export async function getNoSQLCollections(
  projectId: string,
  mongoDatabase: string
): Promise<string[]> {
  const result = await internalFetch<{ collections: string[] }>(
    `/projects/${projectId}/nosql/collections?mongo_database=${mongoDatabase}`
  );
  return result.collections ?? [];
}

/**
 * Fetch documents from a collection (dashboard internal).
 */
export async function getCollectionDocuments(
  projectId: string,
  mongoDatabase: string,
  collection: string,
  opts: { limit?: number; skip?: number } = {}
): Promise<{ docs: any[]; total: number }> {
  const limit = opts.limit ?? 50;
  const skip = opts.skip ?? 0;
  const result = await internalFetch<{ docs: any[]; total: number }>(
    `/projects/${projectId}/nosql/collections/${collection}/documents?mongo_database=${mongoDatabase}&limit=${limit}&skip=${skip}`
  );
  return result;
}

/**
 * Fetch KV keys for a project.
 */
export async function getKVKeys(
  projectId: string,
  mongoDatabase: string,
  prefix?: string
): Promise<{ entries: any[] }> {
  const q = prefix ? `&prefix=${encodeURIComponent(prefix)}` : "";
  const result = await internalFetch<{ entries: any[] }>(
    `/projects/${projectId}/nosql/kv?mongo_database=${mongoDatabase}${q}`
  );
  return result;
}