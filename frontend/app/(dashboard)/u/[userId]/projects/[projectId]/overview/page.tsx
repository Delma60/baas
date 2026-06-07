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
  Activity,
  Copy,
  Terminal,
  Globe,
  Smartphone,
  Server,
  Settings,
  CreditCard,
  ChevronRight,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProjectById, getProjectUsage } from "@/lib/api/client";
import { ReadsWritesChart } from "@/components/dashboard/ReadsWritesChart";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Overview · ${projectId}` };
}

// ─── Modules (Firebase Features Style) ────────────────────────────────────────

const MODULES = [
  {
    id: "auth",
    label: "Authentication",
    description: "Authenticate and manage users",
    icon: ShieldCheck,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-500/10",
  },
  {
    id: "database",
    label: "SQL Database",
    description: "Relational data and Vector AI",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-500/10",
  },
  {
    id: "nosql",
    label: "NoSQL Firestore",
    description: "Flexible document database",
    icon: Layers,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-500/10",
  },
  {
    id: "storage",
    label: "Cloud Storage",
    description: "Store and serve user content",
    icon: HardDrive,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-600/10",
  },
  {
    id: "realtime",
    label: "Realtime Events",
    description: "Listen to database changes",
    icon: Radio,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-500/10",
  },
  {
    id: "functions",
    label: "Edge Functions",
    description: "Run backend code without servers",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-500/10",
  },
];

const MOCK_CHART_DATA = [
  { date: "Jun 1", reads: 4200, writes: 1200 },
  { date: "Jun 2", reads: 3800, writes: 900 },
  { date: "Jun 3", reads: 5100, writes: 1600 },
  { date: "Jun 4", reads: 6200, writes: 2100 },
  { date: "Jun 5", reads: 5800, writes: 1800 },
  { date: "Jun 6", reads: 7100, writes: 2400 },
  { date: "Jun 7", reads: 8400, writes: 2900 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default async function ProjectOverviewPage({ params }: Props) {
  const { userId, projectId } = await params;
  const project = await getProjectById(projectId);
  const stats = await getProjectUsage(projectId);
  //   console.log({project, stats})

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary] tracking-tight">
            Project Overview
          </h1>
          <p className="text-sm text-[--text-secondary] mt-1">{project.name}</p>
        </div>
        <Link
          href={`/u/${userId}/projects/${projectId}/settings`}
          className="flex items-center gap-2 rounded-md bg-[--surface] px-3 py-2 text-sm font-medium text-[--text-primary] border border-[--border] shadow-sm hover:bg-[--surface-hover] transition-colors"
        >
          <Settings className="h-4 w-4 text-[--text-secondary]" />
          Project settings
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        {/* ── LEFT COLUMN (Main Content) ── */}
        <div className="grid grid-cols-1 gap-6 lg:col-span-2">
          {/* 1. Firebase-style "Add App" Hero Card */}
          <div className="overflow-hidden rounded-xl border border-[--border] bg-gradient-to-br from-[--background] to-[--surface] shadow-sm">
            <div className="p-6 text-center sm:p-10">
              <h2 className="text-lg font-semibold text-[--text-primary]">
                Get started by adding YourBaaS to your app
              </h2>
              <p className="mt-2 text-sm text-[--text-secondary]">
                Choose your platform to view setup instructions and initialize
                your SDK.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                <AppPlatformButton icon={MonitorSmartphone} label="Web" />
                <AppPlatformButton icon={Smartphone} label="iOS" />
                <AppPlatformButton icon={Smartphone} label="Android" />
                <AppPlatformButton icon={Server} label="Server" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[--border] bg-[--surface] shadow-sm overflow-hidden">
            <div className="border-b border-[--border] bg-[--background]/50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[--text-primary]">
                Database Operations
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>{" "}
                  Reads
                  <span className="ml-2 flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>{" "}
                  Writes
                </div>
                <select className="hidden sm:block text-sm border border-[--border] rounded-md bg-[--surface] px-2 py-1 text-[--text-secondary] outline-none">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="h-[280px] w-full">
                <ReadsWritesChart data={MOCK_CHART_DATA} />
              </div>
            </div>
          </div>

          {/* 2. Usage Overview / Metrics */}
          <div className="rounded-xl border border-[--border] bg-[--surface] shadow-sm">
            <div className="border-b border-[--border] px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[--text-primary]">
                Usage this month
              </h3>
              <Link
                href={`/u/${userId}/projects/${projectId}/usage`}
                className="text-sm text-brand hover:underline font-medium"
              >
                View detailed usage
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              <MetricItem
                label="API Calls"
                value={stats.apiCalls?.toLocaleString()}
              />
              <MetricItem
                label="Auth Users"
                value={stats.authUsers?.toLocaleString()}
              />
              <MetricItem
                label="SQL Rows"
                value={stats.sqlRows?.toLocaleString()}
              />
              <MetricItem
                label="Storage (MB)"
                value={stats.storageUsedMb?.toString()}
              />
            </div>
          </div>

          {/* 3. Discover Features (Grid) */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-[--text-primary]">
              Discover features
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    href={`/u/${userId}/projects/${projectId}/${mod.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-[--border] bg-[--surface] p-4 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                        mod.bg,
                      )}
                    >
                      <Icon className={cn("h-6 w-6", mod.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[--text-primary] truncate">
                        {mod.label}
                      </p>
                      <p className="text-xs text-[--text-secondary] truncate mt-0.5">
                        {mod.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[--text-muted] transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Sidebar Details) ── */}
        <div className="grid grid-cols-1 gap-6 lg:col-span-1">
          {/* Plan & Status Info */}
          <div className="rounded-xl border border-[--border] bg-[--surface] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[--text-secondary]">
                  Current Plan
                </p>
                <p className="text-base font-semibold text-[--text-primary]">
                  {project?.plan || ""}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[--border] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-[--text-secondary]">Status</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[--text-secondary]">Region</span>
                <span className="font-medium text-[--text-primary]">
                  {project.region}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[--text-secondary]">Project ID</span>
                <span className="font-mono text-xs text-[--text-primary]">
                  {project.id.slice(0, 15)}...
                </span>
              </div>
            </div>
          </div>

          {/* Project Configuration (API Keys) */}
          <div className="rounded-xl border border-[--border] bg-[--surface] shadow-sm">
            <div className="border-b border-[--border] px-5 py-4 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[--text-secondary]" />
              <h3 className="text-sm font-semibold text-[--text-primary]">
                Project Configuration
              </h3>
            </div>
            <div className="p-5 space-y-5">
              <ApiKeyField
                label="Web API Key (Public)"
                value={project?.anonKey || ""}
              />
              <ApiKeyField
                label="Service Role Key (Secret)"
                value={project?.serviceKey || ""}
                isSecret
              />

              <Link
                href={`/u/${userId}/projects/${projectId}/settings/api-keys`}
                className="mt-4 block text-center text-sm font-medium text-brand hover:underline"
              >
                Manage all Service Accounts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppPlatformButton({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <button className="group flex flex-col items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[--border] bg-[--background] shadow-sm transition-all group-hover:border-brand/40 group-hover:bg-[--surface-hover] group-hover:shadow-md">
        <Icon className="h-6 w-6 text-[--text-secondary] transition-colors group-hover:text-brand" />
      </div>
      <span className="text-sm font-medium text-[--text-secondary] group-hover:text-[--text-primary]">
        {label}
      </span>
    </button>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[--background] p-3 text-center border border-[--border]/50">
      <p className="text-2xl font-bold text-[--text-primary]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[--text-secondary] uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function ApiKeyField({
  label,
  value,
  isSecret = false,
}: {
  label: string;
  value: string;
  isSecret?: boolean;
}) {
  // Simple masked view for secrets
  const displayValue = isSecret
    ? value.slice(0, 10) + "••••••••••••••••••••"
    : value;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-[--text-secondary]">
        {label}
      </p>
      <div className="flex items-center justify-between rounded-md border border-[--border] bg-[--background] px-3 py-2">
        <code className="text-xs font-mono text-[--text-primary] truncate mr-4">
          {displayValue}
        </code>
        <button className="shrink-0 text-[--text-muted] hover:text-[--text-primary] transition-colors">
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
