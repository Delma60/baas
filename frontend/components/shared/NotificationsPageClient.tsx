// frontend/components/shared/NotificationsPageClient.tsx
"use client";

import * as React from "react";
import {
  CheckCheck,
  Trash2,
  Bell,
  BellOff,
  Loader2,
  Database,
  ShieldCheck,
  CreditCard,
  TriangleAlert,
  Info,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/api/notifications-client";

// ─── helpers ──────────────────────────────────────────────────────────────────

function notifIcon(type: string) {
  if (type.startsWith("project.")) return Database;
  if (type.includes("invoice_failed") || type.includes("exceeded")) return TriangleAlert;
  if (type.startsWith("billing.")) return CreditCard;
  if (type.startsWith("usage.")) return TriangleAlert;
  if (type.startsWith("auth.")) return ShieldCheck;
  if (type.startsWith("system.")) return Megaphone;
  return Info;
}

function notifColorCls(type: string): string {
  if (type.includes("failed") || type.includes("exceeded") || type.includes("deleted"))
    return "bg-danger-bg text-danger-text";
  if (type.includes("warning") || type.includes("paused") || type.includes("pending"))
    return "bg-warn-bg text-warn-text";
  if (type.includes("paid") || type.includes("created") || type.includes("resumed"))
    return "bg-success-bg text-success-text";
  if (type.startsWith("auth.")) return "bg-info-bg text-info-text";
  if (type.startsWith("system.")) return "bg-brand/10 text-brand";
  return "bg-surface text-text-muted";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

function typeLabel(type: string): string {
  return type.replace(/\./g, " · ").replace(/_/g, " ");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  initialNotifications: Notification[];
  initialTotal: number;
  initialFilter: "all" | "unread";
  currentPage: number;
  pageSize: number;
}

export function NotificationsPageClient({
  userId,
  initialNotifications,
  initialTotal,
  initialFilter,
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
  const [total, setTotal] = React.useState(initialTotal);
  const [filter, setFilter] = React.useState<"all" | "unread">(initialFilter);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [deletingAll, setDeletingAll] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalPages = Math.ceil(total / pageSize);

  const applyFilter = (f: "all" | "unread") => {
    setFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", f);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch(`/api/internal/notifications/${id}`, { method: "PATCH" });
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    await fetch(`/api/internal/notifications/${id}`, { method: "DELETE" });
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/internal/notifications/read-all", { method: "POST" });
    setMarkingAll(false);
  };

  // Navigate page
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-3 bg-background shrink-0">
        {/* Filter tabs */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 gap-0.5">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => applyFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors capitalize",
                filter === f
                  ? "bg-background text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-2xl mx-auto px-0 sm:px-4 py-0 sm:py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
                <BellOff className="h-6 w-6 text-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "Notifications about your projects will appear here"}
                </p>
              </div>
              {filter === "unread" && (
                <button
                  onClick={() => applyFilter("all")}
                  className="text-sm text-brand hover:underline"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background overflow-hidden sm:shadow-sm">
              <div className="divide-y divide-border">
                {filtered.map((notif) => {
                  const Icon = notifIcon(notif.type);
                  const colorCls = notifColorCls(notif.type);
                  const row = (
                    <div
                      key={notif.id}
                      className={cn(
                        "group flex items-start gap-4 px-4 sm:px-5 py-4 relative transition-colors",
                        !notif.is_read
                          ? "bg-brand/[0.04] hover:bg-brand/[0.07]"
                          : "hover:bg-surface/50",
                      )}
                    >
                      {/* Unread indicator */}
                      {!notif.is_read && (
                        <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full bg-brand" />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          colorCls,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={cn(
                              "text-[14px] leading-snug",
                              notif.is_read ? "text-text-secondary" : "font-semibold text-text-primary",
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-text-muted whitespace-nowrap">
                            {relativeTime(notif.created_at)}
                          </span>
                        </div>
                        {notif.body && (
                          <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
                            {notif.body}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[11px] text-text-muted capitalize">
                            {typeLabel(notif.type)}
                          </span>
                          {notif.href && (
                            <Link
                              href={notif.href}
                              onClick={() => !notif.is_read && handleRead(notif.id)}
                              className="text-[11px] font-medium text-brand hover:underline"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Row actions */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={() => handleRead(notif.id)}
                            title="Mark as read"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-danger-text hover:bg-danger-bg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );

                  return notif.href ? (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => !notif.is_read && handleRead(notif.id)}
                      className="block"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div key={notif.id}>{row}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-[12px] text-text-muted">
                Page {currentPage} of {totalPages} · {total} total
              </p>
              <div className="flex gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => goPage(currentPage - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => goPage(currentPage + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}