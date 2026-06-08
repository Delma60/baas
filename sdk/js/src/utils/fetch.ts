// sdk/js/src/utils/fetch.ts

import { BaasError } from "./errors";

export interface FetchConfig {
  baseUrl: string;
  apiKey: string;
  /** Per-project user JWT — set after sign-in */
  userToken?: string;
  /** Default request timeout in ms */
  timeout?: number;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  /** Override timeout for this request */
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    count?: number;
    page?: number;
    limit?: number;
    offset?: number;
    skip?: number;
  };
}

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1_000;

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseErrorResponse(
  response: Response
): Promise<BaasError> {
  let message = `HTTP ${response.status}`;
  let details: Record<string, unknown> | undefined;

  try {
    const json = (await response.json()) as {
      error?: { code?: string; message?: string; details?: Record<string, unknown> };
    };
    if (json.error) {
      message = json.error.message ?? message;
      details = json.error.details;
    }
  } catch {
    // Body not JSON — use status text
    message = response.statusText || message;
  }

  return BaasError.fromHttpStatus(response.status, message, details);
}

export class BaseFetch {
  private config: FetchConfig;

  constructor(config: FetchConfig) {
    this.config = config;
  }

  /** Update the user token after sign-in */
  setUserToken(token: string | undefined): void {
    this.config.userToken = token;
  }

  /** Update the API key (e.g. after key rotation) */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  async request<T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      query,
      headers: extraHeaders,
      timeout = this.config.timeout ?? DEFAULT_TIMEOUT,
    } = options;

    const url = buildUrl(this.config.baseUrl, path, query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      ...(this.config.userToken
        ? { "X-User-Token": this.config.userToken }
        : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    };

    const init: RequestInit = {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    return this._requestWithRetry<T>(url, init, timeout, MAX_RETRIES);
  }

  private async _requestWithRetry<T>(
    url: string,
    init: RequestInit,
    timeout: number,
    retriesLeft: number
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new BaasError("TIMEOUT", `Request timed out after ${timeout}ms`);
      }
      throw new BaasError(
        "NETWORK_ERROR",
        err instanceof Error ? err.message : "Network request failed",
        { cause: err }
      );
    } finally {
      clearTimeout(timer);
    }

    // Retry on 429 with exponential backoff
    if (response.status === 429 && retriesLeft > 0) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RETRY_BASE_DELAY * (MAX_RETRIES - retriesLeft + 1);

      await sleep(delay);
      return this._requestWithRetry<T>(url, init, timeout, retriesLeft - 1);
    }

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const json = (await response.json()) as ApiResponse<T>;
    return json;
  }

  /** Convenience wrappers */

  get<T>(path: string, query?: RequestOptions["query"]): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "GET", query });
  }

  post<T>(path: string, body?: unknown, query?: RequestOptions["query"]): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "POST", body, query });
  }

  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "PATCH", body });
  }

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}