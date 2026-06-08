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
//
// These make baas.db("table"), baas.nosql("collection"), and
// baas.storage("bucket") work as direct function calls while still
// allowing extra properties (.rpc) on baas.db.

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

  /**
   * SQL database — chainable query builder.
   *
   * @example
   * baas.db("posts").select("id, title").filter("status", "eq", "published").order("created_at", "desc").limit(20).execute()
   * baas.db("posts").insert({ title: "Hello" })
   * baas.db("posts").update("abc", { status: "published" })
   * baas.db("posts").delete("abc")
   * baas.db("posts").getById("abc")
   * baas.db.rpc("search_posts").call({ query: "hello" })
   */
  readonly db: DbCallable;

  /**
   * NoSQL (MongoDB) — chainable document builder.
   *
   * @example
   * baas.nosql("articles").find({ published: true }).sort({ createdAt: -1 }).limit(10).execute()
   * baas.nosql("articles").insertOne({ title: "Hi" })
   * baas.nosql("articles").updateOne("id", { $set: { title: "Updated" } })
   * baas.nosql("articles").deleteOne("id")
   * baas.nosql("articles").aggregate([{ $match: { status: "paid" } }])
   */
  readonly nosql: NoSQLCallable;

  /**
   * Key-value store — backed by MongoDB _kv collection.
   *
   * @example
   * await baas.kv.set("user:prefs:theme", "dark")
   * const theme = await baas.kv.get("user:prefs:theme")
   * await baas.kv.delete("user:prefs:theme")
   * const keys = await baas.kv.list({ prefix: "user:prefs:" })
   */
  readonly kv: KVModule;

  /**
   * Object storage (MinIO) — presigned uploads, never proxied through the server.
   *
   * @example
   * const { uploadUrl, fileUrl } = await baas.storage("avatars").upload({ filename: "pic.jpg", contentType: "image/jpeg" })
   * await fetch(uploadUrl, { method: "PUT", body: fileBlob })
   * const files = await baas.storage("docs").listFiles({ prefix: "reports/" })
   */
  readonly storage: StorageCallable;

  /**
   * Project-scoped user auth — email/password, session management.
   *
   * @example
   * await baas.auth.signUp({ email, password, name })
   * const session = await baas.auth.signIn({ email, password })
   * baas.auth.onSessionChange((session) => { ... })
   * await baas.auth.signOut()
   */
  readonly auth: AuthModule;

  /**
   * Realtime change subscriptions via Socket.io.
   * Connection is lazy — opens only on the first subscription.
   *
   * @example
   * const unsub = baas.realtime.on("posts", (event) => console.log(event.type, event.record))
   * const unsub2 = baas.realtime.onCollection("articles", handler)
   * unsub()  // unsubscribe
   */
  readonly realtime: RealtimeModule;

  /**
   * Edge function invocations.
   *
   * @example
   * const result = await baas.functions.invoke("process-order")
   *   .with({ orderId: "ord_123" })
   *   .call()
   */
  readonly functions: FunctionsModule;

  constructor(config: BaasClientConfig) {
    const baseUrl = (config.baseUrl ?? "https://api.yourbaas.com").replace(/\/$/, "");

    this._projectId = config.projectId;

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

    // ─── kv — flat module ─────────────────────────────────────────────────
    this.kv = new KVModule(this.http, config.projectId);

    // ─── storage("bucket") callable ───────────────────────────────────────
    const storageModule = new StorageModule(this.http, config.projectId);
    this.storage = ((bucket: string) =>
      storageModule.bucket(bucket)) as StorageCallable;

    // ─── auth — stateful, manages session + injects X-User-Token ──────────
    this.auth = new AuthModule(this.http, config.projectId);

    // ─── realtime — lazy Socket.io connection ─────────────────────────────
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
   * Cleanly shut down the client — closes the realtime Socket.io connection.
   * Call this when your app unmounts or the user signs out.
   */
  destroy(): void {
    this.realtime.disconnect();
  }
}