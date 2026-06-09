// frontend/components/shared/NotificationBell.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Circle,
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Zap,
  CreditCard,
  TriangleAlert,
  Info,
  Megaphone,
  Loader2,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/api/notifications-client";

// ─── Icon / colour helpers ────────────────────────────────────────────────────

function notifIcon(type: string) {
  if (type.startsWith("project.")) return Database;
  if (type.startsWith("billing.invoice_paid")) return CreditCard;
  if (type.startsWith("billing.invoice_failed")) return TriangleAlert;
  if (type.startsWith("billing.")) return CreditCard;
  if (type.startsWith("usage.limit_exceeded")) return TriangleAlert;
  if (type.startsWith("usage.")) return TriangleAlert;
  if (type.startsWith("auth.")) return ShieldCheck;
  if (type.startsWith("system.")) return Megaphone;
  return Info;
}

function notifColor(type: string): string {
  if (type.includes("failed") || type.includes("exceeded") || type.includes("deleted"))
    return "bg-danger-bg text-danger-text";
  if (type.includes("warning") || type.includes("paused") || type.includes("pending"))
    return "bg-warn-bg text-warn-text";
  if (type.includes("paid") || type.includes("created") || type.includes("resumed"))
    return "bg-success-bg text-success-text";
  if (type.startsWith("auth."))
    return "bg-info-bg text-info-text";
  if (type.startsWith("system."))
    return "bg-brand/10 text-brand";
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
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
    new Date(iso)
  );
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = notifIcon(notif.type);
  const colorCls = notifColor(notif.type);

  const inner = (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors",
        !notif.is_read
          ? "bg-brand/[0.04] hover:bg-brand/[0.07]"
          : "hover:bg-surface/60",
      )}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-brand" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          colorCls,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13px] leading-snug",
            notif.is_read ? "text-text-secondary" : "font-medium text-text-primary",
          )}
        >
          {notif.title}
        </p>
        {notif.body && (
          <p className="mt-0.5 text-[12px] text-text-muted leading-relaxed line-clamp-2">
            {notif.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-text-muted">{relativeTime(notif.created_at)}</p>
      </div>

      {/* Actions (show on hover) */}
      <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.is_read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(notif.id); }}
            title="Mark as read"
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id); }}
          title="Delete"
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-danger-text hover:bg-danger-bg transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  if (notif.href) {
    return (
      <Link href={notif.href} className="block" onClick={() => !notif.is_read && onRead(notif.id)}>
        {inner}
      </Link>
    );
  }
  return <div onClick={() => !notif.is_read && onRead(notif.id)}>{inner}</div>;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  /** Initial notifications SSR'd from the server */
  initialNotifications: Notification[];
  /** Initial unread count SSR'd from the server */
  initialUnreadCount: number;
}

export function NotificationBell({ initialNotifications, initialUnreadCount }: Props) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Refresh when popover opens
  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await fetch("/api/internal/notifications?limit=30");
        if (res.ok) {
          const json = await res.json();
          const notifs: Notification[] = json.data ?? [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.is_read).length);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRead = async (id: string) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/internal/notifications/${id}`, { method: "PATCH" });
  };

  const handleDelete = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/internal/notifications/${id}`, { method: "DELETE" });
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/internal/notifications/read-all", { method: "POST" });
    setMarkingAll(false);
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        title="Notifications"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors",
          open
            ? "bg-surface text-text-primary"
            : "hover:bg-surface hover:text-text-primary",
        )}
        aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-brand text-white font-bold leading-none",
              unreadCount > 9 ? "h-4 w-4 text-[9px]" : "h-3.5 w-3.5 text-[8px]",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute right-0 top-10 z-50 w-[360px] rounded-2xl border border-border bg-background shadow-xl",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-text-primary">Notifications</h3>
              {hasUnread && (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasUnread && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                >
                  {markingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                <p className="text-[12px] text-text-muted">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
                  <BellOff className="h-5 w-5 text-text-muted" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">All caught up</p>
                  <p className="text-xs text-text-muted mt-0.5">No notifications yet</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    onRead={handleRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-[12px] font-medium text-brand hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}