// sdk/js/src/modules/database.ts

import { BaseFetch } from "../utils/fetch";
import { serializeFilters } from "../types/filters";
import type {
  QueryFilter,
  FilterOperator,
  FilterValue,
} from "../types/filters";
import type {
  Row,
  InsertResult,
  DeleteResult,
  ResponseMeta,
} from "../types/index";

// ─── Result types ─────────────────────────────────────────────────────────────

export interface QueryResult<T extends Row = Row> {
  data: T[];
  meta: ResponseMeta;
}

export interface SingleResult<T extends Row = Row> {
  data: T;
}

// ─── Query Builder ────────────────────────────────────────────────────────────

export class QueryBuilder<T extends Row = Row> {
  private http: BaseFetch;
  private projectId: string;
  private tableName: string;

  private _select: string = "*";
  private _filters: QueryFilter[] = [];
  private _order: string | null = null;
  private _orderDir: "asc" | "desc" = "asc";
  private _limit: number = 100;
  private _offset: number = 0;

  constructor(http: BaseFetch, projectId: string, table: string) {
    this.http = http;
    this.projectId = projectId;
    this.tableName = table;
  }

  // ─── Chainable config ──────────────────────────────────────────────────────

  /**
   * Comma-separated column names to return, or "*" for all (default).
   * @example .select("id, title, created_at")
   */
  select(columns: string): this {
    this._select = columns;
    return this;
  }

  /**
   * Add a filter condition.
   * @example .filter("status", "eq", "published")
   * @example .filter("age", "gte", 18)
   * @example .filter("id", "in", ["a", "b", "c"])
   */
  filter(column: string, operator: FilterOperator, value: FilterValue): this {
    this._filters.push({ column, operator, value });
    return this;
  }

  /**
   * Order results by a column.
   * @example .order("created_at", "desc")
   */
  order(column: string, direction: "asc" | "desc" = "asc"): this {
    this._order = column;
    this._orderDir = direction;
    return this;
  }

  /**
   * Maximum number of rows to return (1–1000, default 100).
   */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /**
   * Number of rows to skip (for pagination).
   */
  offset(n: number): this {
    this._offset = n;
    return this;
  }

  // ─── Terminal: list ────────────────────────────────────────────────────────

  /**
   * Execute the query and return a list of rows.
   */
  async execute(): Promise<QueryResult<T>> {
    const query: Record<string, string | number> = {
      select: this._select,
      limit: this._limit,
      offset: this._offset,
    };

    if (this._order) {
      query["order"] = this._order;
      query["order_dir"] = this._orderDir;
    }

    const filterStr = serializeFilters(this._filters);
    if (filterStr) {
      query["filter"] = filterStr;
    }

    const res = await this.http.get<T[]>(
      `/v1/db/${this.projectId}/${this.tableName}`,
      query as Record<string, string | number | boolean | null | undefined>
    );

    return {
      data: res.data,
      meta: res.meta ?? {},
    };
  }

  // ─── Terminal: get single row ──────────────────────────────────────────────

  /**
   * Fetch a single row by its primary key `id`.
   */
  async getById(id: string | number): Promise<T | null> {
    const query: Record<string, string> = {};
    if (this._select !== "*") query["select"] = this._select;

    try {
      const res = await this.http.get<T>(
        `/v1/db/${this.projectId}/${this.tableName}/${id}`,
        query
      );
      return res.data;
    } catch (err: unknown) {
      // Return null on 404 instead of throwing
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

  // ─── Terminal: insert ──────────────────────────────────────────────────────

  /**
   * Insert one or more rows.
   * @example await baas.db("posts").insert({ title: "Hello", status: "draft" })
   * @example await baas.db("posts").insert([{ title: "A" }, { title: "B" }])
   */
  async insert(
    data: Partial<T> | Partial<T>[]
  ): Promise<InsertResult | InsertResult[]> {
    const res = await this.http.post<InsertResult | InsertResult[]>(
      `/v1/db/${this.projectId}/${this.tableName}`,
      { data }
    );
    return res.data;
  }

  /**
   * Update a row by id.
   * @example await baas.db("posts").update("post-id", { status: "published" })
   */
  async update(id: string | number, data: Partial<T>): Promise<T> {
    const res = await this.http.patch<T>(
      `/v1/db/${this.projectId}/${this.tableName}/${id}`,
      { data }
    );
    return res.data;
  }

  /**
   * Delete a row by id.
   */
  async delete(id: string | number): Promise<DeleteResult> {
    const res = await this.http.delete<DeleteResult>(
      `/v1/db/${this.projectId}/${this.tableName}/${id}`
    );
    return res.data;
  }
}

// ─── RPC Builder ──────────────────────────────────────────────────────────────

export class RpcBuilder<T extends Row = Row> {
  private http: BaseFetch;
  private projectId: string;
  private fnName: string;

  constructor(http: BaseFetch, projectId: string, fnName: string) {
    this.http = http;
    this.projectId = projectId;
    this.fnName = fnName;
  }

  /**
   * Call the PostgreSQL function with the given arguments.
   * @example await baas.rpc("get_nearby_posts").call({ lat: 6.5, lng: 3.3 })
   */
  async call(args: Record<string, unknown> = {}): Promise<T[]> {
    const res = await this.http.post<T[]>(
      `/v1/db/${this.projectId}/rpc/${this.fnName}`,
      { args }
    );
    return res.data;
  }
}

// ─── DatabaseModule ───────────────────────────────────────────────────────────

export class DatabaseModule {
  private http: BaseFetch;
  private projectId: string;

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Start building a query for the given table.
   *
   * @example
   * // List
   * const { data, meta } = await baas.db("posts")
   *   .select("id, title, created_at")
   *   .filter("status", "eq", "published")
   *   .order("created_at", "desc")
   *   .limit(20)
   *   .execute()
   *
   * // Insert
   * const row = await baas.db("posts").insert({ title: "Hello" })
   *
   * // Update
   * const updated = await baas.db("posts").update("abc", { status: "published" })
   *
   * // Delete
   * const result = await baas.db("posts").delete("abc")
   *
   * // Get by id
   * const post = await baas.db("posts").getById("abc")
   */
  from<T extends Row = Row>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this.http, this.projectId, table);
  }

  /**
   * Alias for `.from()` — matches the AGENTS.md API surface.
   * @example baas.db("posts").select("*").execute()
   */
  table<T extends Row = Row>(table: string): QueryBuilder<T> {
    return this.from<T>(table);
  }

  /**
   * Call a PostgreSQL function defined in the project schema.
   * @example await baas.rpc("search_posts").call({ query: "hello" })
   */
  rpc<T extends Row = Row>(functionName: string): RpcBuilder<T> {
    return new RpcBuilder<T>(this.http, this.projectId, functionName);
  }
}

/**
 * Proxy wrapper so `baas.db("table")` returns a QueryBuilder directly,
 * matching the AGENTS.md usage: `baas.db("posts").select(...).execute()`
 *
 * Also exposes `.rpc()` on the same object.
 */
export class DatabaseProxy {
  private module: DatabaseModule;

  constructor(http: BaseFetch, projectId: string) {
    this.module = new DatabaseModule(http, projectId);
  }

  /**
   * Returns a QueryBuilder for the given table.
   * Supports all chainable methods: select, filter, order, limit, offset,
   * plus terminal methods: execute, getById, insert, update, delete.
   */
  __call__<T extends Row = Row>(table: string): QueryBuilder<T> {
    return this.module.from<T>(table);
  }

  rpc<T extends Row = Row>(functionName: string): RpcBuilder<T> {
    return this.module.rpc<T>(functionName);
  }
}