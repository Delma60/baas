// sdk/js/src/types/index.ts

// ─── Pagination / Meta ────────────────────────────────────────────────────────

export interface ResponseMeta {
  count?: number;
  page?: number;
  limit?: number;
  offset?: number;
  skip?: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
}

export interface SignUpOptions {
  email: string;
  password: string;
  name?: string;
}

export interface SignInOptions {
  email: string;
  password: string;
}

// ─── SQL Database ─────────────────────────────────────────────────────────────

/** A single row returned from a SQL table. */
export type Row = Record<string, unknown>;

export interface InsertResult extends Row {
  id?: string | number;
}

export interface DeleteResult {
  deleted: boolean;
  id: string | number;
}

export interface RpcResult {
  data: Row[];
}

// ─── NoSQL / Document ─────────────────────────────────────────────────────────

/** A single MongoDB document as returned by the API (ObjectId → string "id"). */
export type Document = Record<string, unknown> & { id?: string };

export interface InsertManyResult {
  insertedIds: string[];
  count: number;
}

// ─── Key-Value ────────────────────────────────────────────────────────────────

export interface KVEntry {
  key: string;
  value: unknown;
  expiresAt?: string | null;
}

export interface KVSetResult {
  key: string;
  value: unknown;
}

export interface KVDeleteResult {
  deleted: boolean;
  key: string;
}

export interface KVBatchResult {
  key: string;
  value?: unknown;
  set?: boolean;
  deleted?: boolean;
  error?: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  uploadUrl: string;
  fileUrl: string;
  filename: string;
  bucket: string;
}

export interface FileMeta {
  key: string;
  size: number;
  lastModified?: string;
  etag?: string;
  contentType?: string;
  url?: string;
}

export interface DownloadUrlResult {
  url: string;
  path: string;
}

export interface DeleteFileResult {
  deleted: boolean;
  key: string;
}

// ─── Edge Functions ───────────────────────────────────────────────────────────

export interface FunctionResult {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  type: RealtimeEventType;
  record?: T;
  old?: T;
  resource: string;
  projectId: string;
}

// ─── Client Config ────────────────────────────────────────────────────────────

export interface BaasClientConfig {
  projectId: string;
  apiKey: string;
  /** API base URL — defaults to https://api.yourbaas.com */
  baseUrl?: string;
  /** Request timeout in ms — default 30000 */
  timeout?: number;
}

// ─── Re-export filter types for consumers ─────────────────────────────────────

export type {
  QueryFilter,
  FilterOperator,
  FilterValue,
  NoSQLFilter,
  NoSQLUpdate,
  NoSQLSort,
  KVSetOptions,
  KVListOptions,
  KVBatchOperation,
  StorageUploadOptions,
  StorageListOptions,
  StorageDownloadOptions,
  RealtimeOptions,
} from "./filters";