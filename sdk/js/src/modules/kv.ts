// sdk/js/src/modules/kv.ts

import { BaseFetch } from "../utils/fetch";
import type {
  KVSetOptions,
  KVListOptions,
  KVBatchOperation,
} from "../types/filters";
import type {
  KVEntry,
  KVSetResult,
  KVDeleteResult,
  KVBatchResult,
} from "../types/index";

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface KVGetResponse {
  key: string;
  value: unknown;
}

interface KVSetResponse {
  key: string;
  value: unknown;
}

interface KVDeleteResponse {
  deleted: boolean;
  key: string;
}

interface KVListResponse {
  entries: KVEntry[];
}

// ─── KVModule ─────────────────────────────────────────────────────────────────

export class KVModule {
  private http: BaseFetch;
  private projectId: string;

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Get the value stored at a key.
   * Returns `null` if the key does not exist or has expired.
   *
   * @example
   * const theme = await baas.kv.get("user:prefs:theme")
   */
  async get(key: string): Promise<unknown> {
    try {
      const res = await this.http.get<KVGetResponse>(
        `/v1/nosql/${this.projectId}/kv/${encodeURIComponent(key)}`
      );
      return res.data.value;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        "statusCode" in err &&
        (err as { statusCode?: number }).statusCode === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Set a value at a key. Overwrites any existing value.
   * Pass `ttl` (seconds) to automatically expire the key.
   *
   * @example
   * await baas.kv.set("user:prefs:theme", "dark")
   * await baas.kv.set("session:abc", { userId: "123" }, { ttl: 3600 })
   */
  async set(
    key: string,
    value: unknown,
    options?: KVSetOptions
  ): Promise<KVSetResult> {
    const res = await this.http.put<KVSetResponse>(
      `/v1/nosql/${this.projectId}/kv/${encodeURIComponent(key)}`,
      { value, ttl: options?.ttl ?? null }
    );
    return { key: res.data.key, value: res.data.value };
  }

  /**
   * Delete a key. Returns true if the key existed and was deleted.
   *
   * @example
   * await baas.kv.delete("user:prefs:theme")
   */
  async delete(key: string): Promise<KVDeleteResult> {
    const res = await this.http.delete<KVDeleteResponse>(
      `/v1/nosql/${this.projectId}/kv/${encodeURIComponent(key)}`
    );
    return res.data;
  }

  /**
   * List all keys, optionally filtered by a prefix.
   *
   * @example
   * const entries = await baas.kv.list({ prefix: "user:prefs:" })
   * const all = await baas.kv.list()
   */
  async list(options?: KVListOptions): Promise<KVEntry[]> {
    const query: Record<string, string | number | undefined> = {};
    if (options?.prefix) query["prefix"] = options.prefix;
    if (options?.limit) query["limit"] = options.limit;

    const res = await this.http.get<KVListResponse>(
      `/v1/nosql/${this.projectId}/kv`,
      query
    );

    // Backend returns { entries: [...] } for internal and { data: [...] } for v1
    const raw = res.data as unknown as { entries?: KVEntry[] } | KVEntry[];
    if (Array.isArray(raw)) return raw;
    return (raw as { entries?: KVEntry[] }).entries ?? [];
  }

  /**
   * Execute multiple get/set/delete operations in a single request.
   *
   * @example
   * const results = await baas.kv.batch([
   *   { op: "set", key: "a", value: 1 },
   *   { op: "get", key: "b" },
   *   { op: "delete", key: "c" },
   * ])
   */
  async batch(operations: KVBatchOperation[]): Promise<KVBatchResult[]> {
    const res = await this.http.post<KVBatchResult[]>(
      `/v1/nosql/${this.projectId}/kv/batch`,
      { operations }
    );
    return res.data;
  }
}