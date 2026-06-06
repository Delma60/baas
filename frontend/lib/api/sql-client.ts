// frontend/lib/api/sql-client.ts
/**
 * Server-side helpers for SQL database dashboard operations.
 * Calls FastAPI /internal/* endpoints using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class SqlApiError extends Error {
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
    throw new SqlApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface SqlTable {
  name: string;
  rows: number;
}

export interface SqlColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface SqlQueryResult {
  rows: Record<string, unknown>[];
  total: number;
  limit?: number;
  offset?: number;
}

export async function getSqlTables(
  projectId: string,
  dbSchema: string
): Promise<SqlTable[]> {
  const result = await internalFetch<{ tables: SqlTable[] }>(
    `/projects/${projectId}/sql/tables?db_schema=${encodeURIComponent(dbSchema)}`
  );
  return result.tables ?? [];
}

export async function getSqlColumns(
  projectId: string,
  dbSchema: string,
  table: string
): Promise<SqlColumn[]> {
  const result = await internalFetch<{ columns: SqlColumn[] }>(
    `/projects/${projectId}/sql/tables/${encodeURIComponent(table)}/columns?db_schema=${encodeURIComponent(dbSchema)}`
  );
  return result.columns ?? [];
}

export async function getSqlRows(
  projectId: string,
  dbSchema: string,
  table: string,
  opts: { limit?: number; offset?: number; orderCol?: string; orderDir?: "asc" | "desc" } = {}
): Promise<SqlQueryResult> {
  const params = new URLSearchParams({ db_schema: dbSchema });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.orderCol) params.set("order_col", opts.orderCol);
  if (opts.orderDir) params.set("order_dir", opts.orderDir);

  return internalFetch<SqlQueryResult>(
    `/projects/${projectId}/sql/tables/${encodeURIComponent(table)}/rows?${params}`
  );
}