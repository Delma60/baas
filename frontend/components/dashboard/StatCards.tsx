// frontend/components/dashboard/StatCards.tsx
import { Folder, Database, HardDrive, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalProjects: number;
  activeProjects: number;
  pausedProjects: number;
  totalSqlRows: number;
  sqlRowsChange: number;
  storageUsedMb: number;
  storageCapacityMb: number;
  apiCallsThisWeek: number;
  apiCallsChange: number;
}

interface StatCardsProps {
  stats: Stats;
  className?: string;
}

export function StatCards({ stats, className }: StatCardsProps) {
  const storagePercent = Math.round(
    (stats.storageUsedMb / stats.storageCapacityMb) * 100,
  );

  const cards = [
    {
      label: "Projects",
      icon: Folder,
      value: stats.totalProjects.toString(),
      sub: `${stats.activeProjects} active · ${stats.pausedProjects} paused`,
      trend: null,
    },
    {
      label: "SQL rows",
      icon: Database,
      value: formatNumber(stats.totalSqlRows),
      sub: null,
      trend: stats.sqlRowsChange,
    },
    {
      label: "Storage used",
      icon: HardDrive,
      value: formatBytes(stats.storageUsedMb),
      sub: `${storagePercent}% of ${formatBytes(stats.storageCapacityMb)}`,
      trend: null,
      progress: storagePercent,
    },
    {
      label: "API calls",
      icon: Zap,
      value: formatNumber(stats.apiCallsThisWeek),
      sub: "this week",
      trend: stats.apiCallsChange,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-border2
          >
            <div className="mb-3 flex items-center gap-1.5 text-xs text-text-secondary
              <Icon className="h-3.5 w-3.5" />
              {card.label}
            </div>
            <p className="text-2xl font-medium leading-none text-text-primary">
              {card.value}
            </p>

            {/* Progress bar for storage */}
            {card.progress !== undefined && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    card.progress > 80
                      ? "bg-danger"
                      : card.progress > 60
                        ? "bg-warning"
                        : "bg-brand",
                  )}
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}

            <div className="mt-2 flex items-center gap-1">
              {card.trend !== null && card.trend !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    card.trend >= 0 ? "text-success"text-danger",
                  )}
                >
                  {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend)}%
                </span>
              )}
              {card.sub && (
                <span className="text-xs text-text-muted">{card.sub}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}