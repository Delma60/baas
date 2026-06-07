// frontend/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Zap,
  Radio,
  Sparkles,
  Settings,
  ChevronDown,
  Check,
  Flame,
  CreditCard,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { Project } from "@/types/baas";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Overview", href: "overview", icon: LayoutDashboard },
  { label: "Database", href: "database", icon: Database },
  { label: "NoSQL", href: "nosql", icon: Layers },
  { label: "Storage", href: "storage", icon: HardDrive },
  { label: "Auth", href: "auth", icon: ShieldCheck },
  { label: "Functions", href: "functions", icon: Zap },
  { label: "Realtime", href: "realtime", icon: Radio },
  { label: "AI / Vectors", href: "ai", icon: Sparkles },
];

// ─── Project Switcher ─────────────────────────────────────────────────────────

function ProjectSwitcher({
  currentProject,
  projects,
  userId,
}: {
  currentProject: Project;
  projects: Project[];
  userId: string;
}) {
  const [open, setOpen] = useState(false);

  const statusColor = {
    active: "bg-emerald-400",
    paused: "bg-yellow-400",
    deleted: "bg-red-400",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-surface-hover outline-none">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand to-orange-600 shadow-sm">
          <Flame className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-text-primary leading-tight">
            {currentProject?.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                statusColor[currentProject?.status],
              )}
            />
            <span className="text-[10px] text-text-muted capitalize">
              {currentProject?.status}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[220px] p-1"
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Projects
          </p>
        </div>

        {projects?.map((p) => (
          <DropdownMenuItem key={p.id}>
            <Link
              href={`/u/${userId}/projects/${p.id}/overview`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand to-orange-600">
                <Flame className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="flex-1 truncate text-sm">{p.name}</span>
              {p.id === currentProject?.id && (
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
              )}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Link
            href={`/u/${userId}/projects/new`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-brand"
            onClick={() => setOpen(false)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">New project</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Plan badge helper ────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: "free" | "starter" | "pro" }) {
  const styles = {
    free: "bg-surface text-text-muted border-border",
    starter:
      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    pro: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        styles[plan],
      )}
    >
      {plan}
    </span>
  );
}

// ─── Subscription Card ────────────────────────────────────────────────────────

function SubscriptionCard({ userId }: { userId: string }) {
  // In a real app this would come from the org/billing API
  const plan: "free" | "starter" | "pro" = "free";

  const planInfo = {
    free: {
      label: "Free Plan",
      desc: "50K rows · 1 GB storage",
      cta: "Upgrade to Starter",
      href: `/u/${userId}/billing`,
      ctaStyle: "bg-brand hover:bg-brand-hover text-white",
      progress: 12,
    },
    starter: {
      label: "Starter Plan",
      desc: "500K rows · 10 GB storage",
      cta: "Upgrade to Pro",
      href: `/u/${userId}/billing`,
      ctaStyle: "bg-blue-600 hover:bg-blue-700 text-white",
      progress: 45,
    },
    pro: {
      label: "Pro Plan",
      desc: "Unlimited rows · 100 GB",
      cta: "Manage billing",
      href: `/u/${userId}/billing`,
      ctaStyle:
        "bg-surface hover:bg-surface-hover text-text-primary border border-border",
      progress: 71,
    },
  };

  const info = planInfo[plan];

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-primary">
            {info.label}
          </span>
        </div>
        <PlanBadge plan={plan} />
      </div>

      <p className="text-[11px] text-text-muted mb-2.5">{info.desc}</p>

      {/* Usage bar */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-muted">Usage</span>
          <span className="text-[10px] font-medium text-text-secondary">
            {info.progress}%
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-surface">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              info.progress > 80
                ? "bg-danger"
                : info.progress > 60
                  ? "bg-warning"
                  : "bg-brand",
            )}
            style={{ width: `${info.progress}%` }}
          />
        </div>
      </div>

      <Link
        href={info.href}
        className={cn(
          "flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          info.ctaStyle,
        )}
      >
        {info.cta}
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  userId: string;
  projectId: string;
  currentProject: Project;
  projects: Project[];
}

export function Sidebar({
  userId,
  projectId,
  currentProject,
  projects,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.includes(`/${href}`);
  };

  const baseUrl = `/u/${userId}/projects/${projectId}`;

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-sidebar-bg">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <Link
          href={`/u/${userId}`}
          className="flex items-center gap-1.5 text-text-muted hover:text-brand transition-colors"
        >
          <Flame className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold text-text-secondary">
            YourBaaS
          </span>
        </Link>
      </div>

      {/* Project Switcher */}
      <div className="p-2.5 border-b border-border">
        <ProjectSwitcher
          currentProject={currentProject}
          projects={projects}
          userId={userId}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`${baseUrl}/${item.href}`}
              className={cn(
                "flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-sidebar-active-text"
                  : "text-sidebar-text hover:bg-surface-hover",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-sidebar-active-text" : "text-sidebar-icon",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2.5 space-y-2 border-t border-border">
        {/* Subscription card */}
        <SubscriptionCard userId={userId} />

        {/* Settings */}
        <Link
          href={`${baseUrl}/settings`}
          className={cn(
            "flex items-center gap-2.5 h-8 w-full px-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive("settings")
              ? "bg-sidebar-active text-sidebar-active-text"
              : "text-sidebar-text hover:bg-surface-hover",
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0",
              isActive("settings")
                ? "text-sidebar-active-text"
                : "text-sidebar-icon",
            )}
          />
          Settings
        </Link>
      </div>
    </aside>
  );
}
