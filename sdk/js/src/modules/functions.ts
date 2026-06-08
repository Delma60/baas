// sdk/js/src/modules/functions.ts

import { BaseFetch } from "../utils/fetch";
import type { FunctionResult } from "../types/index";

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface InvokeResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

// ─── FunctionInvokeBuilder ────────────────────────────────────────────────────

/**
 * Chainable builder for a single function invocation.
 * Returned by `baas.functions.invoke("function-name")`.
 */
export class FunctionInvokeBuilder {
  private http: BaseFetch;
  private projectId: string;
  private functionName: string;

  private _payload: Record<string, unknown> = {};
  private _headers: Record<string, string> = {};

  constructor(http: BaseFetch, projectId: string, functionName: string) {
    this.http = http;
    this.projectId = projectId;
    this.functionName = functionName;
  }

  /**
   * Set the JSON payload sent to the function.
   *
   * @example
   * await baas.functions.invoke("send-email")
   *   .with({ to: "user@example.com", subject: "Hello" })
   *   .call()
   */
  with(payload: Record<string, unknown>): this {
    this._payload = payload;
    return this;
  }

  /**
   * Set additional HTTP headers forwarded to the function endpoint.
   *
   * @example
   * await baas.functions.invoke("protected-fn")
   *   .headers({ "X-Custom-Token": "abc123" })
   *   .call()
   */
  headers(headers: Record<string, string>): this {
    this._headers = headers;
    return this;
  }

  /**
   * Execute the function invocation.
   *
   * @example
   * const result = await baas.functions.invoke("resize-image")
   *   .with({ imageKey: "uploads/photo.jpg", width: 800 })
   *   .call()
   *
   * console.log(result.status)  // 200
   * console.log(result.data)    // function's JSON response
   */
  async call(): Promise<FunctionResult> {
    const res = await this.http.post<InvokeResponse>(
      `/v1/functions/${this.projectId}/invoke/${this.functionName}`,
      {
        payload: this._payload,
        headers: this._headers,
      }
    );

    return {
      status: res.data.status,
      data: res.data.data,
      headers: res.data.headers ?? {},
    };
  }
}

// ─── FunctionsModule ──────────────────────────────────────────────────────────

export class FunctionsModule {
  private http: BaseFetch;
  private projectId: string;

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Start building an invocation for the named edge function.
   *
   * @example
   * // Simple call with no payload
   * const result = await baas.functions.invoke("ping").call()
   *
   * // Call with payload
   * const result = await baas.functions.invoke("process-order")
   *   .with({ orderId: "ord_123", notify: true })
   *   .call()
   *
   * // Call with extra headers
   * const result = await baas.functions.invoke("webhook-relay")
   *   .with({ event: "user.created" })
   *   .headers({ "X-Signature": hmacSignature })
   *   .call()
   */
  invoke(functionName: string): FunctionInvokeBuilder {
    return new FunctionInvokeBuilder(this.http, this.projectId, functionName);
  }
}