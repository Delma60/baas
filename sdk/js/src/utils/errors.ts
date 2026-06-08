// sdk/js/src/utils/errors.ts

export type BaasErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export class BaasError extends Error {
  readonly code: BaasErrorCode;
  readonly statusCode: number | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: BaasErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "BaasError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;

    // Maintains proper stack trace in V8
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, BaasError);
    }
  }

  static fromHttpStatus(
    status: number,
    message: string,
    details?: Record<string, unknown>
  ): BaasError {
    const code = HTTP_STATUS_TO_CODE[status] ?? "UNKNOWN";
    return new BaasError(code, message, { statusCode: status, details });
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

const HTTP_STATUS_TO_CODE: Record<number, BaasErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  500: "SERVER_ERROR",
  502: "SERVER_ERROR",
  503: "SERVER_ERROR",
};