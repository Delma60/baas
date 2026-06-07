// frontend/components/dashboard/ActivityFeed.tsx
import Link from "next/link";
import {
  UserPlus,
  TableProperties,
  Upload,
  KeyRound,
  Sparkles,
  Database,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types/baas";

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

// ─── Icon + color per event type ─────────────────────────────────────────────

const TYPE_META: Record<
  string,
  { bg: string; text: string; Icon: React.ElementType }
> = {
  auth: {
    bg: "bg-[#7F77DD]/10",
    text: "text-[#7F77DD]",
    Icon: UserPlus,
  },
  db: {
    bg: "bg-[--info-bg]",
    text: "text-[--info-text]",
    Icon: TableProperties,
  },
  storage: {
    bg: "bg-[--warn-bg]",
    text: "text-[--warn-text]",
    Icon: Upload,
  },
  key: {
    bg: "bg-[--success-bg]",
    text: "text-[--success-text]",
    Icon: KeyRound,
  },
  ai: {
    bg: "bg-brand/10",
    text: "text-brand
    Icon: Sparkles,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[--text-primary]">
          Recent activity
        </h2>
        <Link
          href="/dashboard/logs"
          className="text-xs text-brander:underline"
        >
          View log →
        </Link>
      </div>

      <div className="rounded-xl border border-[--border] bg-[--background]">
        {activities.map((activity, idx) => {
          const meta = TYPE_META[activity.type] ?? TYPE_META.db;
          const { Icon } = meta;

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3",
                idx < activities.length - 1 && "border-b border-[--border]",
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]",
                  meta.bg,
                  meta.text,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-[--text-primary]">
                  <ActivityMessage message={activity.message} />
                  <span className="ml-1.5 inline-flex items-center rounded-[4px] border border-[--border] bg-[--surface] px-1.5 py-0.5 text-[11px] text-[--text-secondary]">
                    {activity.projectName}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-[--text-muted]">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders message text with **bold** markdown segments highlighted.
 */
function ActivityMessage({ message }: { message: string }) {
  const parts = message.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-medium text-[--text-primary]">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}