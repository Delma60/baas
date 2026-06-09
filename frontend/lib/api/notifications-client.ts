// frontend/lib/api/notifications-client.ts
/**
 * Server-side helpers for the notification system.
 * Calls FastAPI /internal/notifications/* using X-Internal-Secret.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class NotificationsApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function internalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${FASTAPI_BASE_URL}/internal${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b?.detail ?? b?.error?.message ?? msg;
    } catch {}
    throw new NotificationsApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export type NotificationType =
  | "project.created"
  | "project.paused"
  | "project.resumed"
  | "project.deleted"
  | "billing.invoice_paid"
  | "billing.invoice_failed"
  | "billing.invoice_pending"
  | "usage.limit_warning"
  | "usage.limit_exceeded"
  | "auth.new_signup"
  | "system.announcement"
  | string;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  meta: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResult {
  notifications: Notification[];
  total: number;
}

export async function getNotifications(
  userId: string,
  opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
): Promise<NotificationsResult> {
  const params = new URLSearchParams({ user_id: userId });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.unreadOnly) params.set("unread_only", "true");

  const result = await internalFetch<Notification[]>(
    `/notifications?${params}`
  );
  // The endpoint returns {data: [...], meta: {count}} so we get the array here
  return {
    notifications: Array.isArray(result) ? result : [],
    total: 0,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await internalFetch<{ count: number }>(
    `/notifications/unread-count?user_id=${userId}`
  );
  return result.count ?? 0;
}