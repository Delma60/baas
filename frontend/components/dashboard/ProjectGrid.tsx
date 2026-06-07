// frontend/components/dashboard/ProjectGrid.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Smartphone,
  FileText,
  BarChart3,
  Plus,
  MapPin,
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/baas";

interface ProjectGridProps {
  projects: Project[];
  className?: string;
}

type FilterTab = "all" | "active" | "paused";

// ─── Module metadata ──────────────────────────────────────────────────────────

const MODULE_META: Record<string, { icon: React.ElementType; label: string }> =
  {
    sql: { icon: Database, label: "SQL" },
    nosql: { icon: Layers, label: "NoSQL" },
    auth: { icon: ShieldCheck, label: "Auth" },
    storage: { icon: HardDrive, label: "Storage" },
    realtime: { icon: Radio, label: "Realtime" },
    ai: { icon: Sparkles, label: "AI" },
    functions: { icon: Zap, label: "Functions" },
  };

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  cart: ShoppingCart,
  mobile: Smartphone,
  article: FileText,
  chart: BarChart3,
};

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  orange: {
    bg: "bg-brand/10",
    text: "text-brand",
    icon: "text-brand",
  },
  blue: {
    bg: "bg-info-bg",
    text: "text-info-text",
    icon: "text-info-text",
  },
  green: {
    bg: "bg-success-bg",
    text: "text-success-text",
    icon: "text-success-text",
  },
  purple: {
    bg: "bg-[#7F77DD]/10",
    text: "text-[#7F77DD]",
    icon: "text-[#7F77DD]",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectGrid({ projects, className }: ProjectGridProps) {
  const [filter, setFilter] = React.useState<FilterTab>("all");

  const filtered = projects.filter(
    (p) => filter === "all" || p.status === filter,
  );

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    paused: projects.filter((p) => p.status === "paused").length,
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-primary">Projects</h2>
        <Link
          href="/dashboard/projects"
          className="text-xs text-brand hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-0.5 rounded-[8px] border border-border bg-surface p-0.5">
        {(["all", "active", "paused"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "flex-1 rounded-[6px] px-3 py-1.5 text-xs capitalize transition-colors",
              filter === tab
                ? "bg-background font-medium text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {tab === "all"
              ? `All (${counts.all})`
              : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${counts[tab]})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* New project card */}
        {filter !== "paused" && (
          <Link
            href="/dashboard/projects/new"
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border2 p-4 text-text-muted transition-colors hover:border-brand hover:bg-brand/5 hover:text-brand"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">New project</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const Icon = ICON_MAP[project.icon] ?? Database;
  const colors = COLOR_MAP[project.color] ?? COLOR_MAP.orange;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-background p-4 transition-all hover:border-border2 hover:-translate-y-px",
        project.status === "active" && "hover:border-brand/30",
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-lg",
            colors.bg,
            colors.icon,
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-text-primary">
            {project.name}
          </p>
          <p className="truncate text-xs text-text-muted">
            {project.organizationName}
          </p>
        </div>

        <StatusDot status={project.status as "active" | "paused"} />
      </div>

      {/* Module pills */}
      <div className="mb-3 flex flex-wrap gap-1">
        {project.modules.map((mod) => {
          const meta = MODULE_META[mod];
          if (!meta) return null;
          const ModIcon = meta.icon;
          return (
            <span
              key={mod}
              className="flex items-center gap-1 rounded-[5px] border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary"
            >
              <ModIcon className="h-3 w-3 text-text-muted" />
              {meta.label}
            </span>
          );
        })}
      </div>

      {/* Footer meta */}
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-3 text-[11px] text-text-muted">
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

      {/* Paused overlay tint */}
      {project.status === "paused" && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-background/40" />
      )}
    </Link>
  );
}

function StatusDot({ status }: { status: "active" | "paused" }) {
  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "active"
          ? "bg-success-bg text-success-text"
          : "bg-warn-bg text-warn-text",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          status === "active" && "animate-pulse",
        )}
      />
      {status === "active" ? "Active" : "Paused"}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
