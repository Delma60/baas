// frontend/app/dashboard/projects/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  Plus,
  ShoppingCart,
  Smartphone,
  FileText,
  BarChart3,
  MapPin,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProjects } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Projects" };

// ─── Mock data ───────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "proj_store_api",
    name: "store-api",
    description: "E-commerce backend for Acme store",
    status: "active" as const,
    region: "Lagos",
    icon: "cart",
    color: "orange" as const,
    modules: ["sql", "nosql", "auth", "storage", "realtime"] as const,
    sqlRows: 18_400,
    apiCalls: 12_300,
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "proj_mobile",
    name: "mobile-backend",
    description: "Auth + data API for iOS/Android app",
    status: "active" as const,
    region: "Lagos",
    icon: "mobile",
    color: "blue" as const,
    modules: ["sql", "auth", "ai"] as const,
    sqlRows: 9_800,
    apiCalls: 7_100,
    updatedAt: new Date(Date.now() - 18 * 60 * 1000),
  },
  {
    id: "proj_cms",
    name: "cms-staging",
    description: "Headless CMS staging environment",
    status: "paused" as const,
    region: "London",
    icon: "article",
    color: "purple" as const,
    modules: ["sql", "nosql", "storage"] as const,
    sqlRows: 10_000,
    apiCalls: 0,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

// ─── Module meta ──────────────────────────────────────────────────────────────

const MODULE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  sql: { icon: Database, label: "SQL", color: "text-blue-500" },
  nosql: { icon: Layers, label: "NoSQL", color: "text-green-500" },
  auth: { icon: ShieldCheck, label: "Auth", color: "text-purple-500" },
  storage: { icon: HardDrive, label: "Storage", color: "text-yellow-500" },
  realtime: { icon: Radio, label: "Realtime", color: "text-red-500" },
  ai: { icon: Sparkles, label: "AI", color: "text-pink-500" },
  functions: { icon: Zap, label: "Functions", color: "text-orange-500" },
};

const ICON_MAP: Record<string, React.ElementType> = {
  cart: ShoppingCart,
  mobile: Smartphone,
  article: FileText,
  chart: BarChart3,
};

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  orange: { bg: "bg-[--brand]/10", icon: "text-[--brand]" },
  blue: { bg: "bg-[--info-bg]", icon: "text-[--info-text]" },
  green: { bg: "bg-[--success-bg]", icon: "text-[--success-text]" },
  purple: { bg: "bg-[#7F77DD]/10", icon: "text-[#7F77DD]" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const projects = await getProjects();
  const activeCount = projects.filter((p) => p.status === "active").length;
  const pausedCount = projects.filter((p) => p.status === "paused").length;

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.length} total · ${activeCount} active · ${pausedCount} paused`}
        icon={Database}
        iconColor="orange"
        actions={
          <Link
            href="/dashboard/projects/new"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[--brand] px-3 text-xs font-semibold text-white transition-colors hover:bg-[--brand-hover]"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-6">
        {PROJECTS.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No projects yet"
            description="Create your first project to get started with your backend infrastructure."
            action={
              <Link
                href="/dashboard/projects/new"
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[--brand] px-4 text-xs font-semibold text-white transition-colors hover:bg-[--brand-hover]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create project
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((project) => {
              const Icon = ICON_MAP[project.icon] ?? Database;
              const colors = COLOR_MAP[project.color] ?? COLOR_MAP.orange;

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className={cn(
                    "group relative flex flex-col rounded-xl border border-[--border] bg-[--background] p-5 transition-all",
                    "hover:border-[--brand]/30 hover:-translate-y-px hover:shadow-sm",
                    project.status === "paused" && "opacity-70"
                  )}
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]",
                        colors.bg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", colors.icon)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[--text-primary]">
                          {project.name}
                        </p>
                        <StatusBadge status={project.status} />
                      </div>
                      {project.description && (
                        <p className="mt-0.5 truncate text-xs text-[--text-muted]">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Module pills */}
                  <div className="mb-4 flex flex-wrap gap-1">
                    {project.modules.map((mod) => {
                      const meta = MODULE_META[mod];
                      if (!meta) return null;
                      const ModIcon = meta.icon;
                      return (
                        <span
                          key={mod}
                          className="flex items-center gap-1 rounded-[5px] border border-[--border] bg-[--surface] px-1.5 py-0.5 text-[11px] text-[--text-secondary]"
                        >
                          <ModIcon className={cn("h-3 w-3", meta.color)} />
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center gap-3 border-t border-[--border] pt-3 text-[11px] text-[--text-muted]">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {formatNumber(project.sqlRows)} rows
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {project.status === "paused"
                        ? "Paused"
                        : `${formatNumber(project.apiCalls)} calls`}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.region}
                    </span>
                  </div>

                  {/* Updated at */}
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-[--text-muted]">
                    <Clock className="h-3 w-3" />
                    Updated {formatRelativeTime(project.updatedAt)}
                  </div>
                </Link>
              );
            })}

            {/* New project card */}
            <Link
              href="/dashboard/projects/new"
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[--border2] p-5 text-[--text-muted] transition-all hover:border-[--brand] hover:bg-[--brand]/5 hover:text-[--brand]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[--surface]">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New project</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "active" | "paused" }) {
  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "active"
          ? "bg-[--success-bg] text-[--success-text]"
          : "bg-[--warn-bg] text-[--warn-text]"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          status === "active" && "animate-pulse"
        )}
      />
      {status === "active" ? "Active" : "Paused"}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}