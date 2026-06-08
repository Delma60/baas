// sdk/js/src/modules/nosql.ts

import { BaseFetch } from "../utils/fetch";
import type {
  NoSQLFilter,
  NoSQLUpdate,
  NoSQLSort,
} from "../types/filters";
import type {
  Document,
  InsertManyResult,
  DeleteResult,
  ResponseMeta,
} from "../types/index";

// ─── Result types ─────────────────────────────────────────────────────────────

export interface FindResult<T extends Document = Document> {
  data: T[];
  meta: ResponseMeta;
}

// ─── Find Builder ─────────────────────────────────────────────────────────────

export class FindBuilder<T extends Document = Document> {
  private http: BaseFetch;
  private projectId: string;
  private collectionName: string;

  private _filter: NoSQLFilter = {};
  private _sort: NoSQLSort | null = null;
  private _limit: number = 100;
  private _skip: number = 0;

  constructor(http: BaseFetch, projectId: string, collection: string) {
    this.http = http;
    this.projectId = projectId;
    this.collectionName = collection;
  }

  // ─── Chainable config ──────────────────────────────────────────────────────

  /**
   * MongoDB-style filter document.
   * @example .filter({ category: "tech", published: true })
   * @example .filter({ age: { $gte: 18 } })
   */
  filter(filter: NoSQLFilter): this {
    this._filter = filter;
    return this;
  }

  /**
   * Sort by one or more fields.
   * Use 1 for ascending, -1 for descending.
   * @example .sort({ createdAt: -1 })
   */
  sort(sort: NoSQLSort): this {
    this._sort = sort;
    return this;
  }

  /**
   * Maximum number of documents to return (1–1000, default 100).
   */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /**
   * Number of documents to skip (for pagination).
   */
  skip(n: number): this {
    this._skip = n;
    return this;
  }

  // ─── Terminal: execute find ────────────────────────────────────────────────

  /**
   * Execute the find query and return matching documents.
   *
   * @example
   * const { data, meta } = await baas.nosql("articles")
   *   .find({ category: "tech" })
   *   .sort({ createdAt: -1 })
   *   .limit(10)
   *   .execute()
   */
  async execute(): Promise<FindResult<T>> {
    const query: Record<string, string | number | boolean | null | undefined> =
      {
        limit: this._limit,
        skip: this._skip,
      };

    // Encode sort as sort_field + sort_dir query params
    // Backend accepts: ?sort_field=createdAt&sort_dir=-1
    if (this._sort) {
      const entries = Object.entries(this._sort);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        query["sort_field"] = field;
        query["sort_dir"] = dir;
      }
    }

    // Filter is sent as a JSON body via POST to the find endpoint.
    // The backend's GET endpoint doesn't accept a filter body, so we
    // use the filter query param for simple cases and fall back to POST
    // aggregate for complex filters. For the SDK we POST to the collection
    // route with the filter encoded as query param JSON.
    // Actually the backend GET /nosql/{projectId}/collections/{collection}
    // does NOT accept a filter body — it only supports sort/limit/skip.
    // For filter support we use the aggregate pipeline endpoint.
    if (Object.keys(this._filter).length > 0) {
      return this._executeViaAggregate();
    }

    const res = await this.http.get<T[]>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}`,
      query
    );

    return {
      data: res.data,
      meta: res.meta ?? {},
    };
  }

  /** Fall back to aggregation pipeline when a filter is provided */
  private async _executeViaAggregate(): Promise<FindResult<T>> {
    const pipeline: NoSQLFilter[] = [{ $match: this._filter }];

    if (this._sort) {
      pipeline.push({ $sort: this._sort });
    }

    if (this._skip > 0) {
      pipeline.push({ $skip: this._skip });
    }

    pipeline.push({ $limit: this._limit });

    const res = await this.http.post<T[]>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}/aggregate`,
      { pipeline }
    );

    return {
      data: res.data,
      meta: { count: res.data.length, limit: this._limit, skip: this._skip },
    };
  }
}

// ─── CollectionBuilder ────────────────────────────────────────────────────────

/**
 * Entry point for all operations on a single collection.
 * Returned by `baas.nosql("collection-name")`.
 */
export class CollectionBuilder<T extends Document = Document> {
  private http: BaseFetch;
  private projectId: string;
  private collectionName: string;

  constructor(http: BaseFetch, projectId: string, collection: string) {
    this.http = http;
    this.projectId = projectId;
    this.collectionName = collection;
  }

  // ─── Find ──────────────────────────────────────────────────────────────────

  /**
   * Start a find query with an optional filter.
   *
   * @example
   * const { data } = await baas.nosql("articles")
   *   .find({ category: "tech" })
   *   .sort({ createdAt: -1 })
   *   .limit(10)
   *   .execute()
   */
  find(filter: NoSQLFilter = {}): FindBuilder<T> {
    return new FindBuilder<T>(
      this.http,
      this.projectId,
      this.collectionName
    ).filter(filter);
  }

  /**
   * Fetch a single document by its id.
   * Returns `null` if not found.
   */
  async findById(id: string): Promise<T | null> {
    try {
      const res = await this.http.get<T>(
        `/v1/nosql/${this.projectId}/collections/${this.collectionName}/${id}`
      );
      return res.data;
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

  // ─── Insert ────────────────────────────────────────────────────────────────

  /**
   * Insert a single document.
   * @example const doc = await baas.nosql("articles").insertOne({ title: "Hello" })
   */
  async insertOne(data: Omit<T, "id">): Promise<T> {
    const res = await this.http.post<T>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}`,
      { data }
    );
    return res.data;
  }

  /**
   * Insert multiple documents in a single request.
   * @example const result = await baas.nosql("articles").insertMany([{ title: "A" }, { title: "B" }])
   */
  async insertMany(
    docs: Array<Omit<T, "id">>
  ): Promise<InsertManyResult> {
    const res = await this.http.post<{ inserted_ids: string[]; count?: number }>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}`,
      { data: docs }
    );

    return {
      insertedIds: res.data.inserted_ids,
      count: res.data.inserted_ids.length,
    };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update a document by id using MongoDB update operators.
   * If no operator is provided, wraps the update in `$set` automatically.
   *
   * @example await baas.nosql("articles").updateOne("doc-id", { $set: { title: "Updated" } })
   * @example await baas.nosql("articles").updateOne("doc-id", { title: "Updated" }) // auto $set
   */
  async updateOne(id: string, update: NoSQLUpdate): Promise<T> {
    // Auto-wrap plain objects in $set if no operator present
    const hasOperator = Object.keys(update).some((k) => k.startsWith("$"));
    const payload = hasOperator ? update : { $set: update };

    const res = await this.http.patch<T>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}/${id}`,
      { update: payload }
    );
    return res.data;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  /**
   * Delete a document by id.
   */
  async deleteOne(id: string): Promise<DeleteResult> {
    const res = await this.http.delete<{ deleted: boolean; id: string }>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}/${id}`
    );
    return res.data;
  }

  // ─── Aggregation ──────────────────────────────────────────────────────────

  /**
   * Run a MongoDB aggregation pipeline.
   * @example
   * const results = await baas.nosql("orders").aggregate([
   *   { $match: { status: "paid" } },
   *   { $group: { _id: "$userId", total: { $sum: "$amount" } } },
   *   { $sort: { total: -1 } },
   * ])
   */
  async aggregate(pipeline: NoSQLFilter[]): Promise<T[]> {
    const res = await this.http.post<T[]>(
      `/v1/nosql/${this.projectId}/collections/${this.collectionName}/aggregate`,
      { pipeline }
    );
    return res.data;
  }
}

// ─── NoSQLModule ──────────────────────────────────────────────────────────────

export class NoSQLModule {
  private http: BaseFetch;
  private projectId: string;

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Returns a CollectionBuilder for the given collection name.
   *
   * @example
   * baas.nosql("articles").find({ published: true }).limit(20).execute()
   * baas.nosql("articles").insertOne({ title: "Hi" })
   * baas.nosql("articles").updateOne("id", { $set: { title: "Updated" } })
   * baas.nosql("articles").deleteOne("id")
   * baas.nosql("articles").aggregate([{ $match: { status: "paid" } }])
   */
  collection<T extends Document = Document>(
    name: string
  ): CollectionBuilder<T> {
    return new CollectionBuilder<T>(this.http, this.projectId, name);
  }
}