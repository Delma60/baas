// sdk/js/src/index.ts

// ─── Main entry point ─────────────────────────────────────────────────────────
export { BaasClient } from "./client";

// ─── Modules (for advanced use / type extension) ──────────────────────────────
export { AuthModule } from "./modules/auth";
export {
  DatabaseModule,
  QueryBuilder,
  RpcBuilder,
  DatabaseProxy,
} from "./modules/database";
export {
  NoSQLModule,
  CollectionBuilder,
  FindBuilder,
} from "./modules/nosql";
export { KVModule } from "./modules/kv";
export { StorageModule, BucketBuilder } from "./modules/storage";
export { RealtimeModule } from "./modules/realtime";
export { FunctionsModule, FunctionInvokeBuilder } from "./modules/functions";

// ─── Error ────────────────────────────────────────────────────────────────────
export { BaasError } from "./utils/errors";
export type { BaasErrorCode } from "./utils/errors";

// ─── Shared types ─────────────────────────────────────────────────────────────
export type {
  // Config
  BaasClientConfig,
  // Auth
  AuthUser,
  AuthSession,
  SignUpOptions,
  SignInOptions,
  // SQL
  Row,
  InsertResult,
  DeleteResult,
  RpcResult,
  // NoSQL
  Document,
  InsertManyResult,
  // KV
  KVEntry,
  KVSetResult,
  KVDeleteResult,
  KVBatchResult,
  // Storage
  UploadResult,
  FileMeta,
  DeleteFileResult,
  DownloadUrlResult,
  // Functions
  FunctionResult,
  // Realtime
  RealtimeEventType,
  RealtimeEvent,
  // Meta
  ResponseMeta,
} from "./types/index";

export type {
  // SQL filters
  QueryFilter,
  FilterOperator,
  FilterValue,
  // NoSQL filters
  NoSQLFilter,
  NoSQLUpdate,
  NoSQLSort,
  // KV options
  KVSetOptions,
  KVListOptions,
  KVBatchOperation,
  // Storage options
  StorageUploadOptions,
  StorageListOptions,
  StorageDownloadOptions,
  // Realtime options
  RealtimeOptions,
} from "./types/filters";