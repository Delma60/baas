// sdk/js/src/types/filters.ts

// ─── SQL / Query Filters ──────────────────────────────────────────────────────

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "is";

export type FilterValue = string | number | boolean | null | (string | number)[];

export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: FilterValue;
}

/**
 * Serialises a QueryFilter array into the ?filter= query param format
 * the backend expects: "col:op:value,col:op:value"
 */
export function serializeFilters(filters: QueryFilter[]): string | undefined {
  if (filters.length === 0) return undefined;
  return filters
    .map(({ column, operator, value }) => {
      const serializedValue = Array.isArray(value)
        ? value.join("|") // backend parses lists — use pipe-delimited for in operator
        : value === null
        ? "null"
        : value === true
        ? "true"
        : value === false
        ? "false"
        : String(value);
      return `${column}:${operator}:${serializedValue}`;
    })
    .join(",");
}

// ─── NoSQL / MongoDB Filters ──────────────────────────────────────────────────

/** A plain MongoDB-style filter document. */
export type NoSQLFilter = Record<string, unknown>;

/** MongoDB update operators document e.g. { $set: { title: "hi" } } */
export type NoSQLUpdate = Record<string, unknown>;

/** Sort specification: field → 1 (asc) or -1 (desc) */
export type NoSQLSort = Record<string, 1 | -1>;

// ─── Key-Value Options ────────────────────────────────────────────────────────

export interface KVSetOptions {
  /** Time-to-live in seconds. Key expires after this duration. */
  ttl?: number;
}

export interface KVListOptions {
  /** Only return keys starting with this prefix */
  prefix?: string;
  /** Maximum number of keys to return (default 100, max 1000) */
  limit?: number;
}

export interface KVBatchOperation {
  op: "get" | "set" | "delete";
  key: string;
  value?: unknown;
  ttl?: number;
}

// ─── Storage Options ──────────────────────────────────────────────────────────

export interface StorageUploadOptions {
  filename: string;
  contentType: string;
  /** Presigned URL expiry in seconds (60–86400, default 3600) */
  expiresIn?: number;
}

export interface StorageListOptions {
  /** Filter files by key prefix */
  prefix?: string;
  limit?: number;
}

export interface StorageDownloadOptions {
  /** Presigned URL expiry in seconds (60–86400, default 3600) */
  expiresIn?: number;
}

// ─── Realtime Options ─────────────────────────────────────────────────────────

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeOptions {
  eventTypes?: RealtimeEventType[];
}