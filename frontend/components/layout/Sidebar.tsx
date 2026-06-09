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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "overview",
    icon: LayoutDashboard,
    comingSoon: false,
  },
];

const BUILD_ITEMS = [
  { label: "Database", href: "database", icon: Database, comingSoon: false },
  { label: "NoSQL", href: "nosql", icon: Layers, comingSoon: true },
  { label: "Storage", href: "storage", icon: HardDrive, comingSoon: false },
  { label: "Auth", href: "auth", icon: ShieldCheck, comingSoon: false },
  { label: "Functions", href: "functions", icon: Zap, comingSoon: false },
  { label: "Realtime", href: "realtime", icon: Radio, comingSoon: false },
  { label: "AI / Vectors", href: "ai", icon: Sparkles, comingSoon: true }
];

// ─── Plan badge ───────────────────────────────────────────────────────────────

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

  const statusDot: Record<string, string> = {
    active: "bg-emerald-400",
    paused: "bg-yellow-400",
    deleted: "bg-red-400",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Switch project"
        className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        {/* <button > */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand to-orange-600 shadow-sm ring-1 ring-offset-1 ring-transparent group-focus-within:ring-sidebar-ring">
          <Flame className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-sidebar-foreground leading-tight">
            {currentProject?.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                statusDot[currentProject?.status] ?? "bg-gray-400",
              )}
            />
            <span className="text-[10px] text-sidebar-foreground/60 capitalize">
              {currentProject?.status}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
        {/* </button> */}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[220px] p-1"
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </p>
        </div>

        {projects?.map((p) => (
          <DropdownMenuItem key={p.id}>
            <Link
              href={`/u/${userId}/projects/${p.id}/overview`}
              onClick={() => setOpen(false)}
              aria-current={p.id === currentProject?.id ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer w-full",
                p.id === currentProject?.id && "bg-brand/10 ring-1 ring-brand",
              )}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand to-orange-600">
                <Flame className="h-2.5 w-2.5 text-white" aria-hidden="true" />
              </div>
              <span className="flex-1 truncate text-sm">{p.name}</span>
              {p.id === currentProject?.id && (
                <Check
                  className="h-3.5 w-3.5 text-brand shrink-0"
                  aria-hidden="true"
                />
              )}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Link
            href={`/u/${userId}/projects/new`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-brand w-full"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">New project</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({ userId }: { userId: string }) {
  // TODO: pull real plan from org/project context
  const plan: "free" | "starter" | "pro" = "free";

  const planInfo = {
    free: {
      label: "Free Plan",
      desc: "50K rows · 1 GB storage",
      cta: "Upgrade to Starter",
      href: `/u/${userId}/billing`,
      progress: 12,
    },
    starter: {
      label: "Starter Plan",
      desc: "500K rows · 10 GB storage",
      cta: "Upgrade to Pro",
      href: `/u/${userId}/billing`,
      progress: 45,
    },
    pro: {
      label: "Pro Plan",
      desc: "Unlimited rows · 100 GB",
      cta: "Manage billing",
      href: `/u/${userId}/billing`,
      progress: 71,
    },
  };

  const info = planInfo[plan];

  return (
    <div className="rounded-xl  bg-sidebar-accent/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-sidebar-foreground/50" />
          <span className="text-xs font-medium text-sidebar-foreground">
            {info.label}
          </span>
        </div>
        <PlanBadge plan={plan} />
      </div>

      <p className="text-[11px] text-sidebar-foreground/50 mb-2.5">
        {info.desc}
      </p>

      {/* Usage bar */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-sidebar-foreground/50">Usage</span>
          <span className="text-[10px] font-medium text-sidebar-foreground/70">
            {info.progress}%
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-sidebar-border">
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
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-hover transition-colors"
        aria-label={info.cta}
      >
        {info.cta}
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

function AppSidebar({
  userId,
  projectId,
  currentProject,
  projects,
}: {
  userId: string;
  projectId: string;
  currentProject: Project;
  projects: Project[];
}) {
  const pathname = usePathname();
  const baseUrl = `/u/${userId}/projects/${projectId}`;

  const isActive = (href: string) => {
    const target = `${baseUrl}/${href}`;
    if (!pathname) return false;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      side="left"
      role="navigation"
      aria-label="Project sidebar"
    >
      {/* ── Header: brand + project switcher ── */}
      <SidebarHeader className="p-2.5 border-b border-sidebar-border gap-2">
        {/* Brand row */}
        <Link
          href={`/u/${userId}`}
          aria-label="YourBaaS home"
          className="flex items-center gap-1.5 px-1 py-0.5 text-sidebar-foreground/60 hover:text-brand transition-colors group-data-[collapsible=icon]:justify-center"
        >
          <Flame className="h-4 w-4 text-brand shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            YourBaaS
          </span>
        </Link>

        {/* Project switcher — hidden when collapsed to icon */}
        <div className="group-data-[collapsible=icon]:hidden">
          <ProjectSwitcher
            currentProject={currentProject}
            projects={projects}
            userId={userId}
          />
        </div>

        {/* Collapsed: just the flame icon as project indicator */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand to-orange-600">
            <Flame className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </SidebarHeader>

      {/* ── Main nav ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                if (item.comingSoon) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={false}
                        disabled
                        tooltip={`${item.label} (coming soon)`}
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span aria-hidden="true">{item.label}</span>
                        <span className="sr-only">
                          {item.label} (coming soon)
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[9px] px-1 py-0 h-4 group-data-[collapsible=icon]:hidden"
                        >
                          Soon
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={active} tooltip={item.label}>
                      <Link
                        href={`${baseUrl}/${item.href}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md",
                          active
                            ? "bg-brand/10 text-brand"
                            : "text-sidebar-text hover:bg-surface-hover",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-brand" : "text-sidebar-icon",
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Build
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {BUILD_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                if (item.comingSoon) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={false}
                        disabled
                        tooltip={`${item.label} (coming soon)`}
                        className="opacity-50 cursor-not-allowed ml-2"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span aria-hidden="true">{item.label}</span>
                        <span className="sr-only">
                          {item.label} (coming soon)
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[9px]  py-0 h-4 group-data-[collapsible=icon]:hidden"
                        >
                          Soon
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={active} tooltip={item.label}>
                      <Link
                        href={`${baseUrl}/${item.href}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md",
                          active
                            ? "bg-brand/10 text-brand"
                            : "text-sidebar-text hover:bg-surface-hover",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-brand" : "text-sidebar-icon",
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: subscription card + settings ── */}
      <SidebarFooter className="p-2.5 border-t border-sidebar-border gap-2">
        {/* Subscription card — hidden when icon-collapsed */}
        <div className="group-data-[collapsible=icon]:hidden">
          <SubscriptionCard userId={userId} />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              
              isActive={isActive("settings")}
              tooltip="Settings"
            >
              <Link href={`${baseUrl}/settings`} className="flex items-center gap-2.5 w-full">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

// ─── LayoutShell-compatible export ───────────────────────────────────────────

export interface SidebarProps {
  userId: string;
  projectId: string;
  currentProject: Project;
  projects: Project[];
  /** @deprecated — shadcn SidebarProvider handles mobile state internally */
  mobileOpen?: boolean;
  /** @deprecated */
  onMobileOpenChange?: (open: boolean) => void;
}

export function ProjectSidebar({
  userId,
  projectId,
  currentProject,
  projects,
}: SidebarProps) {
  return (
    <AppSidebar
      userId={userId}
      projectId={projectId}
      currentProject={currentProject}
      projects={projects}
    />
  );
}

// Keep the old export name for backwards compat with LayoutShell
export { ProjectSidebar as Sidebar };
