// sdk/js/src/client.ts

import { BaseFetch } from "./utils/fetch";
import { AuthModule } from "./modules/auth";
import { DatabaseModule, QueryBuilder, RpcBuilder } from "./modules/database";
import { NoSQLModule, CollectionBuilder } from "./modules/nosql";
import { KVModule } from "./modules/kv";
import { StorageModule, BucketBuilder } from "./modules/storage";
import { RealtimeModule } from "./modules/realtime";
import { FunctionsModule } from "./modules/functions";
import type { BaasClientConfig, Row, Document } from "./types/index";

// ─── Callable type helpers ────────────────────────────────────────────────────

type DbCallable = {
  <T extends Row = Row>(table: string): QueryBuilder<T>;
  rpc<T extends Row = Row>(fnName: string): RpcBuilder<T>;
};

type NoSQLCallable = {
  <T extends Document = Document>(collection: string): CollectionBuilder<T>;
};

type StorageCallable = {
  (bucket: string): BucketBuilder;
};

// ─── Wake-up result ───────────────────────────────────────────────────────────

export interface WakeUpResult {
  /** true if the backend responded with status "ok" */
  ok: boolean;
  /** round-trip latency in milliseconds */
  latencyMs: number;
  /** number of attempts made before a successful response (or maxAttempts) */
  attempts: number;
  /** error message if all attempts failed */
  error?: string;
}

// ─── BaasClient ───────────────────────────────────────────────────────────────

/**
 * The main entry point for the YourBaaS JavaScript/TypeScript SDK.
 *
 * @example
 * import { BaasClient } from "@yourbaas/sdk"
 *
 * const baas = new BaasClient({
 *   projectId: "proj_abc123",
 *   apiKey: "sk_anon_...",
 *   baseUrl: "https://api.yourbaas.com",
 * })
 *
 * // Wake up a Render-hosted backend before first use
 * await baas.wakeUp()
 *
 * // SQL
 * const { data } = await baas.db("posts").filter("status", "eq", "published").execute()
 *
 * // NoSQL
 * const doc = await baas.nosql("articles").insertOne({ title: "Hello" })
 *
 * // KV
 * await baas.kv.set("theme", "dark")
 *
 * // Storage
 * const { uploadUrl } = await baas.storage("avatars").upload({ filename: "pic.jpg", contentType: "image/jpeg" })
 *
 * // Auth
 * const session = await baas.auth.signIn({ email, password })
 *
 * // Realtime
 * const unsub = baas.realtime.on("posts", (event) => console.log(event))
 *
 * // Functions
 * const result = await baas.functions.invoke("send-email").with({ to: "a@b.com" }).call()
 */
export class BaasClient {
  private http: BaseFetch;
  private readonly _projectId: string;
  private readonly _baseUrl: string;

  /**
   * SQL database — chainable query builder.
   */
  readonly db: DbCallable;

  /**
   * NoSQL (MongoDB) — chainable document builder.
   */
  readonly nosql: NoSQLCallable;

  /**
   * Key-value store — backed by MongoDB _kv collection.
   */
  readonly kv: KVModule;

  /**
   * Object storage (MinIO) — presigned uploads, never proxied through the server.
   */
  readonly storage: StorageCallable;

  /**
   * Project-scoped user auth — email/password, session management.
   */
  readonly auth: AuthModule;

  /**
   * Realtime change subscriptions via Socket.io.
   */
  readonly realtime: RealtimeModule;

  /**
   * Edge function invocations.
   */
  readonly functions: FunctionsModule;

  constructor(config: BaasClientConfig) {
    const baseUrl = (config.baseUrl ?? (typeof process !== "undefined" ? process.env?.BAAS_BASE_URL : undefined) ?? "").replace(/\/$/, "");

    this._projectId = config.projectId;
    this._baseUrl = baseUrl;

    this.http = new BaseFetch({
      baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });

    // ─── db("table") callable with .rpc() property ────────────────────────
    const dbModule = new DatabaseModule(this.http, config.projectId);
    const dbFn = <T extends Row = Row>(table: string) => dbModule.from<T>(table);
    this.db = Object.assign(dbFn, {
      rpc: <T extends Row = Row>(fnName: string) => dbModule.rpc<T>(fnName),
    }) as DbCallable;

    // ─── nosql("collection") callable ─────────────────────────────────────
    const nosqlModule = new NoSQLModule(this.http, config.projectId);
    this.nosql = (<T extends Document = Document>(collection: string) =>
      nosqlModule.collection<T>(collection)) as NoSQLCallable;

    // ─── kv ───────────────────────────────────────────────────────────────
    this.kv = new KVModule(this.http, config.projectId);

    // ─── storage("bucket") callable ───────────────────────────────────────
    const storageModule = new StorageModule(this.http, config.projectId);
    this.storage = ((bucket: string) =>
      storageModule.bucket(bucket)) as StorageCallable;

    // ─── auth ─────────────────────────────────────────────────────────────
    this.auth = new AuthModule(this.http, config.projectId);

    // ─── realtime ─────────────────────────────────────────────────────────
    this.realtime = new RealtimeModule(this.http, config.projectId, baseUrl);
    this.realtime._setApiKey(config.apiKey);

    // ─── functions ────────────────────────────────────────────────────────
    this.functions = new FunctionsModule(this.http, config.projectId);
  }

  /** The project ID this client is scoped to. */
  get projectId(): string {
    return this._projectId;
  }

  /**
   * Ping the backend's /health endpoint to wake up a Render cold-start instance.
   *
   * Render free/starter instances spin down after 15 minutes of inactivity and
   * take 30–60 seconds to cold-start on the next request. Call `wakeUp()` early
   * (e.g. on app mount) so the backend is warm before the user needs it.
   *
   * The method retries with exponential back-off and resolves (never rejects) so
   * it is safe to fire-and-forget with `void baas.wakeUp()` or `await` it before
   * your first real request.
   *
   * @param options.maxAttempts   Maximum number of ping attempts (default: 5)
   * @param options.intervalMs    Initial retry delay in ms; doubles each attempt (default: 3000)
   * @param options.timeoutMs     Per-attempt request timeout in ms (default: 10000)
   * @param options.onAttempt     Optional callback fired on each attempt number
   *
   * @example — fire and forget
   * void baas.wakeUp()
   *
   * @example — await before first request
   * const { ok, latencyMs, attempts } = await baas.wakeUp()
   * if (!ok) console.warn("Backend may still be starting up")
   *
   * @example — with status callback for a loading UI
   * await baas.wakeUp({
   *   onAttempt: (n) => setStatus(`Connecting… (attempt ${n})`),
   * })
   */
  async wakeUp(options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
    onAttempt?: (attempt: number) => void;
  }): Promise<WakeUpResult> {
    const maxAttempts = options?.maxAttempts ?? 5;
    const initialIntervalMs = options?.intervalMs ?? 3_000;
    const timeoutMs = options?.timeoutMs ?? 10_000;
    const onAttempt = options?.onAttempt;

    const url = `${this._baseUrl}/health`;
    const start = Date.now();
    let lastError = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      onAttempt?.(attempt);

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
          response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        if (response.ok) {
          const json = await response.json().catch(() => ({}));
          // Our /health endpoint returns { status: "ok" }
          if (json?.status === "ok") {
            return {
              ok: true,
              latencyMs: Date.now() - start,
              attempts: attempt,
            };
          }
        }

        lastError = `HTTP ${response.status}`;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          lastError = `Attempt ${attempt} timed out after ${timeoutMs}ms`;
        } else {
          lastError = err instanceof Error ? err.message : "Network error";
        }
      }

      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        const delay = initialIntervalMs * Math.pow(2, attempt - 1);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      ok: false,
      latencyMs: Date.now() - start,
      attempts: maxAttempts,
      error: lastError,
    };
  }

  /**
   * Cleanly shut down the client — closes the realtime Socket.io connection.
   */
  destroy(): void {
    this.realtime.disconnect();
  }
}