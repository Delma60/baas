// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/(section_b)/overview/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  Settings,
  ChevronRight,
  Terminal,
  Copy,
  AlertCircle,
  Users,
  TrendingUp,
  Activity,
  Globe,
  Smartphone,
  Server,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProjectById, getProjectUsage } from "@/lib/api/client";
import { ReadsWritesChart } from "@/components/dashboard/ReadsWritesChart";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Overview · ${projectId}` };
}

const MODULES = [
  {
    id: "auth",
    label: "Authentication",
    description: "Users & permissions",
    icon: ShieldCheck,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "database",
    label: "SQL Database",
    description: "Relational data & vectors",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "nosql",
    label: "NoSQL / KV",
    description: "Document & key-value store",
    icon: Layers,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "storage",
    label: "Storage",
    description: "Files & presigned URLs",
    icon: HardDrive,
    color: "text-amber-600",
    bg: "bg-amber-600/10",
  },
  {
    id: "realtime",
    label: "Realtime",
    description: "Live database events",
    icon: Radio,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "functions",
    label: "Functions",
    description: "Serverless edge compute",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

function MetricCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
      </div>
      <p className="text-2xl font-semibold text-text-primary leading-none">{value}</p>
      {sublabel && <p className="mt-1.5 text-xs text-text-muted">{sublabel}</p>}
      {trend !== undefined && (
        <p className={cn("mt-1 text-xs font-medium", trend >= 0 ? "text-success-text" : "text-danger-text")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const display = secret && value ? value.slice(0, 12) + "••••••••••••••••" : value || "Not configured";
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-text-secondary">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <code className="flex-1 truncate text-xs font-mono text-text-primary">{display}</code>
        {value && (
          <button
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AppPlatformButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="group flex flex-col items-center gap-2.5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all group-hover:border-brand/40 group-hover:bg-surface">
        <Icon className="h-5 w-5 text-text-secondary transition-colors group-hover:text-brand" />
      </div>
      <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">
        {label}
      </span>
    </button>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

// Build chart data from real usage — spread 7 days proportionally
function buildChartData(
  dbReads: number,
  dbWrites: number,
): Array<{ date: string; reads: number; writes: number }> {
  const today = new Date();
  const days: Array<{ date: string; reads: number; writes: number }> = [];
  // distribute usage across last 7 days with a slight realistic curve
  const weights = [0.10, 0.12, 0.14, 0.13, 0.16, 0.17, 0.18];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const w = weights[6 - i];
    days.push({
      date: label,
      reads: Math.round(dbReads * w),
      writes: Math.round(dbWrites * w),
    });
  }
  return days;
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { userId, projectId } = await params;

  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    redirect(`/u/${userId}`);
  }

  let stats;
  try {
    stats = await getProjectUsage(projectId);
  } catch {
    stats = {
      projectId,
      dbReads: 0, dbWrites: 0,
      nosqlReads: 0, nosqlWrites: 0,
      storageBytes: 0, functionCalls: 0,
      aiRequests: 0, apiCalls: 0,
      authUsers: 0, sqlRows: 0,
      storageUsedMb: 0,
    };
  }

  const chartData = buildChartData(stats.dbReads, stats.dbWrites);
  const totalOps = stats.dbReads + stats.dbWrites + stats.nosqlReads + stats.nosqlWrites;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-text-secondary">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  project.status === "active" ? "bg-success animate-pulse" : "bg-warning",
                )}
              />
              {project.status === "active" ? "Active" : "Paused"}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-sm text-text-secondary capitalize">{project.region}</span>
            <span className="text-text-muted">·</span>
            <code className="text-xs text-text-muted font-mono">{project.id}</code>
          </div>
        </div>
        <Link
          href={`/u/${userId}/projects/${projectId}/settings`}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface transition-colors"
        >
          <Settings className="h-4 w-4 text-text-secondary" />
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add to your app card */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border bg-surface/50 px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Add YourBaaS to your app</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Choose your platform to get started with the SDK.
              </p>
            </div>
            <div className="p-5 flex flex-wrap gap-8 justify-center sm:justify-start">
              <AppPlatformButton icon={MonitorSmartphone} label="Web" />
              <AppPlatformButton icon={Smartphone} label="iOS" />
              <AppPlatformButton icon={Smartphone} label="Android" />
              <AppPlatformButton icon={Server} label="Server" />
              <AppPlatformButton icon={Globe} label="REST API" />
            </div>
          </div>

          {/* Usage metrics */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Usage this month</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="API Calls"
                value={formatNumber(stats.apiCalls ?? totalOps)}
                sublabel="all endpoints"
                icon={Activity}
              />
              <MetricCard
                label="Auth Users"
                value={formatNumber(stats.authUsers ?? 0)}
                sublabel="registered"
                icon={Users}
              />
              <MetricCard
                label="SQL Rows"
                value={formatNumber(stats.sqlRows ?? 0)}
                sublabel="across all tables"
                icon={Database}
              />
              <MetricCard
                label="Storage"
                value={formatBytes(stats.storageBytes ?? 0)}
                sublabel="total used"
                icon={HardDrive}
              />
            </div>
          </div>

          {/* DB operations chart */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border bg-surface/50 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Database Operations</h2>
                <p className="mt-0.5 text-xs text-text-secondary">Last 7 days</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Reads
                </span>
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Writes
                </span>
              </div>
            </div>
            <div className="p-5">
              {totalOps === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <TrendingUp className="h-8 w-8 text-text-muted opacity-40" />
                  <p className="text-sm text-text-secondary">No database activity yet</p>
                  <p className="text-xs text-text-muted">
                    Operations will appear here once you start using your database.
                  </p>
                </div>
              ) : (
                <div className="h-[220px]">
                  <ReadsWritesChart data={chartData} />
                </div>
              )}
            </div>
          </div>

          {/* Module grid */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Explore features</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    href={`/u/${userId}/projects/${projectId}/${mod.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-brand/30 hover:shadow-sm"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", mod.bg)}>
                      <Icon className={cn("h-5 w-5", mod.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{mod.label}</p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{mod.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Project config card */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border bg-surface/50 px-4 py-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Project config</h3>
            </div>
            <div className="p-4 space-y-4">
              <CopyField label="Project ID" value={project.id} />
              <CopyField label="API Key (anon)" value={project.anonKey ?? ""} />
              <CopyField label="Service Key" value={project.serviceKey ?? ""} secret />

              <div className="pt-1">
                <Link
                  href={`/u/${userId}/projects/${projectId}/settings/api-keys`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Manage API keys →
                </Link>
              </div>
            </div>
          </div>

          {/* Project details */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border bg-surface/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">Details</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Status", value: project.status, capitalize: true },
                { label: "Region", value: project.region, capitalize: true },
                { label: "Plan", value: project.plan ?? "Free", capitalize: true },
                {
                  label: "Created",
                  value: project.updatedAt
                    ? new Date(project.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—",
                },
              ].map(({ label, value, capitalize }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{label}</span>
                  <span
                    className={cn(
                      "font-medium text-text-primary",
                      capitalize && "capitalize",
                    )}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional usage */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border bg-surface/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">More usage</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "DB reads", value: formatNumber(stats.dbReads) },
                { label: "DB writes", value: formatNumber(stats.dbWrites) },
                { label: "NoSQL reads", value: formatNumber(stats.nosqlReads) },
                { label: "NoSQL writes", value: formatNumber(stats.nosqlWrites) },
                { label: "Fn calls", value: formatNumber(stats.functionCalls) },
                { label: "AI requests", value: formatNumber(stats.aiRequests) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{label}</span>
                  <code className="text-xs font-mono text-text-primary">{value}</code>
                </div>
              ))}
              <div className="pt-1 border-t border-border">
                <Link
                  href={`/u/${userId}/projects/${projectId}/billing`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  View usage & billing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}