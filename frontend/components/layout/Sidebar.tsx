// frontend/components/layout/Sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  Settings,
  Search,
  LayoutDashboard,
  BarChart3,
  KeyRound,
  ScrollText,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCog,
  Package,
  ClipboardList,
  ShieldAlert,
  Flag,
  ExternalLink,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import type { User } from "next-auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  variant: "dashboard" | "superadmin";
  user: User;
  /** Active project context — if set, shows project-scoped module nav */
  projectId?: string;
  projectName?: string;
  orgPlan?: "free" | "starter" | "pro";
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "new" | "beta";
  matchExact?: boolean;
  external?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ─── Nav definitions ──────────────────────────────────────────────────────────
// http://localhost:3000/u/bc04ca07-ad9a-44b2-9003-31ee2a5d305f/projects/proj_my-app_29nvg2/overview

function getDashboardGroups(user:string, projectId?: string): NavGroup[] {
  if (!projectId) {
    return [
      {
        items: [
          { label: "Overview",   href: "/overview",          icon: LayoutDashboard, matchExact: true },
          { label: "Projects",   href: "/overview/projects", icon: FolderOpen },
          { label: "Members",    href: "/overview/members",  icon: Users },
          { label: "Billing",    href: "/overview/billing",  icon: CreditCard },
          { label: "Settings",   href: "/overview/settings", icon: Settings },
        ],
      },
    ];
  }

  const base = `/u/${user}/projects/${projectId}`;

  return [
    {
      items: [
        { label: "Overview", href: base, icon: LayoutDashboard, matchExact: true },
      ],
    },
    {
      label: "Build",
      items: [
        { label: "SQL Database",   href: `${base}/database`,  icon: Database },
        { label: "NoSQL / KV",     href: `${base}/nosql`,     icon: Layers },
        { label: "Auth",           href: `${base}/auth`,      icon: ShieldCheck },
        { label: "Storage",        href: `${base}/storage`,   icon: HardDrive },
        { label: "Realtime",       href: `${base}/realtime`,  icon: Radio },
        { label: "AI / Vectors",   href: `${base}/ai`,        icon: Sparkles, badge: "new", badgeVariant: "new" },
        { label: "Edge Functions", href: `${base}/functions`, icon: Zap },
      ],
    },
    {
      label: "Manage",
      items: [
        { label: "API Keys",  href: `${base}/settings/api-keys`, icon: KeyRound },
        { label: "Usage",     href: `${base}/usage`,             icon: BarChart3 },
        { label: "Logs",      href: `${base}/logs`,              icon: ScrollText },
        { label: "Settings",  href: `${base}/settings`,          icon: Settings },
      ],
    },
  ];
}

const SUPERADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Metrics",       href: "/superadmin",              icon: BarChart3,    matchExact: true },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Users",         href: "/superadmin/users",        icon: UserCog },
      { label: "Organizations", href: "/superadmin/organizations", icon: Building2 },
      { label: "Projects",      href: "/superadmin/projects",     icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Billing",       href: "/superadmin/billing",      icon: CreditCard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff",         href: "/superadmin/staff",        icon: ShieldAlert },
      { label: "Audit Log",     href: "/superadmin/audit",        icon: ClipboardList },
      { label: "Feature Flags", href: "/superadmin/flags",        icon: Flag },
    ],
  },
];

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: "Free",    color: "text-muted-foreground" },
  starter: { label: "Starter", color: "text-sky-500" },
  pro:     { label: "Pro",     color: "text-[--brand]" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  variant,
  user,
  projectId,
  projectName,
  orgPlan = "free",
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const isAdmin = variant === "superadmin";

  const groups = isAdmin
    ? SUPERADMIN_GROUPS
    : getDashboardGroups(user?.id || '', projectId);

  const initials = getInitials(user.name ?? user.email ?? "U");
  const plan = PLAN_LABELS[orgPlan] ?? PLAN_LABELS.free;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col bg-[#f8f9fa] dark:bg-[#17181a] border-r border-[--border] transition-all duration-200 select-none",
        collapsed ? "w-[60px]" : "w-[260px]",
        className,
      )}
    >
      {/* ── Logo + project switcher ── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-[--border] px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href={isAdmin ? "/superadmin" : "/dashboard"}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div
            className={cn(
              "flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[6px]",
              isAdmin ? "bg-[--admin-brand]" : "bg-[--brand]",
            )}
          >
            <Database className="h-[14px] w-[14px] text-white" />
          </div>
          {!collapsed && (
            <span className="text-[14px] font-semibold text-[--text-primary] truncate">
              {isAdmin ? "Superadmin" : "YourBaaS"}
            </span>
          )}
        </Link>
      </div>

      {/* ── Search ── */}
      {!collapsed && (
        <div className="px-3 py-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-[6px] border border-[--border] bg-white dark:bg-[#2d2f31] px-2.5 py-1.5 text-[13px] text-[--text-muted] transition-colors hover:border-[--border2] hover:text-[--text-secondary]"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search</span>
            <kbd className="ml-auto rounded border border-[--border] bg-[--bg3] px-1 text-[10px] text-[--text-muted]">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center py-2.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text-primary]">
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Project context header (when inside a project) ── */}
      {!collapsed && !isAdmin && projectId && (
        <div className="mx-3 mb-1">
          <button className="flex w-full items-center gap-2 rounded-[6px] bg-white dark:bg-[#2d2f31] border border-[--border] px-2.5 py-2 text-left hover:border-[--border2] transition-colors">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-[--brand] text-[10px] font-bold text-white">
              {(projectName ?? "P")[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate text-[13px] font-medium text-[--text-primary]">
              {projectName ?? projectId}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
          </button>
        </div>
      )}

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-2">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {/* Group label */}
            {!collapsed && group.label && (
              <p className="mb-0.5 mt-3 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">
                {group.label}
              </p>
            )}
            {collapsed && group.label && gi > 0 && (
              <div className="my-1.5 flex justify-center">
                <div className="h-px w-6 bg-[--border]" />
              </div>
            )}

            {/* Items */}
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Plan footer ── */}
      {!collapsed && !isAdmin && (
        <>
          <Separator />
          <div className="px-3 py-3">
            <div className="flex items-center justify-between rounded-[8px] border border-[--border] bg-white dark:bg-[#2d2f31] px-3 py-2.5">
              <div>
                <p className={cn("text-[13px] font-semibold", plan.color)}>
                  {plan.label}
                </p>
                <p className="text-[11px] text-[--text-muted]">
                  {orgPlan === "free" ? "No cost · $0/month" : orgPlan === "starter" ? "₦15,000/month" : "₦45,000/month"}
                </p>
              </div>
              {orgPlan !== "pro" && (
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-1 rounded-full border border-[--brand]/30 bg-[--brand]/10 px-2.5 py-1 text-[11px] font-semibold text-[--brand] transition-colors hover:bg-[--brand]/20"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── User row ── */}
      <Separator />
      <UserRow
        user={user}
        initials={initials}
        collapsed={collapsed}
        isAdmin={isAdmin}
      />

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-[13px] top-[54px] z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[--border] bg-white dark:bg-[#2d2f31] text-[--text-muted] shadow-sm transition-all hover:border-[--border2] hover:text-[--text-primary]",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  item,
  pathname,
  collapsed,
  isAdmin,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  isAdmin: boolean;
}) {
  const isActive = item.matchExact
    ? pathname === item.href
    : pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/superadmin";

  const Icon = item.icon;

  const content = (
    <>
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive
            ? isAdmin ? "text-[--admin-brand]" : "text-[--brand]"
            : "text-[--sidebar-icon]",
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-[13px]">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide",
                item.badgeVariant === "new"
                  ? "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
                  : "bg-[--warn-bg] text-[--warn-text]",
              )}
            >
              {item.badge}
            </span>
          )}
          {item.external && (
            <ExternalLink className="h-3 w-3 text-[--text-muted]" />
          )}
        </>
      )}
    </>
  );

  const className = cn(
    "flex h-[34px] w-full items-center gap-2.5 rounded-[6px] px-2 transition-colors",
    isActive
      ? isAdmin
        ? "bg-[--admin-sidebar-active] text-[--admin-sidebar-active-text] font-medium"
        : "bg-[--sidebar-active] text-[--sidebar-active-text] font-medium"
      : "text-[--sidebar-text] hover:bg-white dark:hover:bg-[#2d2f31]",
    collapsed && "justify-center px-0 w-9 mx-auto",
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} title={collapsed ? item.label : undefined}>
      {content}
    </Link>
  );
}

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
  user,
  initials,
  collapsed,
  isAdmin,
}: {
  user: User;
  initials: string;
  collapsed: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      {open && !collapsed && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-[8px] border border-[--border] bg-white dark:bg-[#2d2f31] py-1 shadow-lg z-20">
          <Link
            href="/dashboard/settings/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-[--text-secondary] hover:bg-[--surface-hover] hover:text-[--text-primary]"
          >
            <Settings className="h-3.5 w-3.5" />
            Account settings
          </Link>
          <Separator className="my-1" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[--text-secondary] hover:bg-[--surface-hover] hover:text-[--text-primary]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-12 w-full items-center gap-2.5 px-3 transition-colors hover:bg-[--surface-hover]",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--info-bg] text-[11px] font-semibold text-[--info-text]">
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-[13px] font-medium text-[--text-primary]">
              {user.name ?? "User"}
            </p>
            <p className="truncate text-[11px] text-[--text-muted]">{user.email}</p>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}