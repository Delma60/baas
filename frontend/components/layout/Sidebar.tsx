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
  LogOut,
  ArrowUpRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import type { User } from "next-auth";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  variant: "dashboard" | "superadmin";
  user: User;
  projectId?: string;
  projectName?: string;
  orgPlan?: "free" | "starter" | "pro";
  className?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "new" | "beta" | "soon";
  matchExact?: boolean;
  external?: boolean;
  disabled?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

function getDashboardGroups(userId: string, projectId?: string): NavGroup[] {
  if (!projectId) {
    return [
      {
        items: [
          {
            label: "Overview",
            href: "/overview",
            icon: LayoutDashboard,
            matchExact: true,
          },
          { label: "Projects", href: "/overview/projects", icon: FolderOpen },
          { label: "Members", href: "/overview/members", icon: Users },
          { label: "Billing", href: "/overview/billing", icon: CreditCard },
          { label: "Settings", href: "/overview/settings", icon: Settings },
        ],
      },
    ];
  }

  const base = `/u/${userId}/projects/${projectId}`;

  return [
    {
      items: [
        {
          label: "Overview",
          href: `${base}/overview`,
          icon: LayoutDashboard,
          matchExact: true,
        },
      ],
    },
    {
      label: "Build",
      items: [
        { label: "SQL Database", href: `${base}/database`, icon: Database },
        { label: "NoSQL / KV", href: `${base}/nosql`, icon: Layers },
        { label: "Auth", href: `${base}/auth`, icon: ShieldCheck },
        { label: "Storage", href: `${base}/storage`, icon: HardDrive },
        { label: "Realtime", href: `${base}/realtime`, icon: Radio },
        {
          label: "AI / Vectors",
          href: `${base}/ai`,
          icon: Sparkles,
          badge: "soon",
          badgeVariant: "soon",
          disabled: true,
        },
        { label: "Edge Functions", href: `${base}/functions`, icon: Zap },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          label: "API Keys",
          href: `${base}/settings/api-keys`,
          icon: KeyRound,
        },
        { label: "Usage", href: `${base}/usage`, icon: BarChart3 },
        { label: "Logs", href: `${base}/logs`, icon: ScrollText },
        { label: "Settings", href: `${base}/settings`, icon: Settings },
      ],
    },
  ];
}

const SUPERADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      {
        label: "Metrics",
        href: "/superadmin",
        icon: BarChart3,
        matchExact: true,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Users", href: "/superadmin/users", icon: UserCog },
      {
        label: "Organizations",
        href: "/superadmin/organizations",
        icon: Building2,
      },
      { label: "Projects", href: "/superadmin/projects", icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Billing", href: "/superadmin/billing", icon: CreditCard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", href: "/superadmin/staff", icon: ShieldAlert },
      { label: "Audit Log", href: "/superadmin/audit", icon: ClipboardList },
      { label: "Feature Flags", href: "/superadmin/flags", icon: Flag },
    ],
  },
];

const PLAN_CONFIG = {
  free: {
    label: "Free",
    price: "$0/mo",
    className: "text-[--text-muted]",
    accent: "bg-[--surface] text-[--text-muted]",
  },
  starter: {
    label: "Starter",
    price: "₦15,000/mo",
    className: "text-sky-600 dark:text-sky-400",
    accent: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  },
  pro: {
    label: "Pro",
    price: "₦45,000/mo",
    className: "text-brand",
    accent: "bg-[--sidebar-active] text-[--sidebar-active-text]",
  },
} as const;

// ─── Inner sidebar content ────────────────────────────────────────────────────

interface SidebarContentProps {
  variant: "dashboard" | "superadmin";
  user: User;
  projectId?: string;
  projectName?: string;
  orgPlan?: "free" | "starter" | "pro";
  collapsed?: boolean;
  onCollapse?: () => void;
  onNavigate?: () => void;
}

function SidebarContent({
  variant,
  user,
  projectId,
  projectName,
  orgPlan = "free",
  collapsed = false,
  onCollapse,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();
  const isAdmin = variant === "superadmin";
  const groups = isAdmin
    ? SUPERADMIN_GROUPS
    : getDashboardGroups(user?.id ?? "", projectId);
  const initials = getInitials(user.name ?? user.email ?? "U");
  const plan = PLAN_CONFIG[orgPlan];

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[--sidebar-bg] select-none overflow-hidden",
        !collapsed && "w-full",
      )}
    >
      {/* ── Logo / Header ── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-[--border] px-3 gap-2.5",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href={isAdmin ? "/superadmin" : "/overview"}
          className="flex items-center gap-2.5 min-w-0"
          onClick={onNavigate}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]",
              isAdmin ? "bg-[--admin-brand]" : "bg-brand",
            )}
          >
            <Database className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-[13.5px] font-semibold tracking-tight text-[--text-primary]">
              {isAdmin ? "Superadmin" : "YourBaaS"}
            </span>
          )}
        </Link>

        {!collapsed && isAdmin && (
          <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-950/60 dark:text-red-400">
            Admin
          </span>
        )}
      </div>

      {/* ── Search ── */}
      <div
        className={cn("px-2 py-2 shrink-0", collapsed && "flex justify-center")}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text-primary] transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>
        ) : (
          <button className="flex w-full items-center gap-2 rounded-md border border-[--border] bg-[--background] px-2.5 py-1.5 text-[12.5px] text-[--text-muted] transition-colors hover:bg-[--surface] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search…</span>
            <kbd className="ml-auto hidden sm:block rounded border border-[--border] bg-[--bg3] px-1 py-0.5 text-[10px] leading-none text-[--text-muted]">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* ── Project switcher ── */}
      {!collapsed && !isAdmin && projectId && (
        <div className="mx-2 mb-1 shrink-0">
          <button className="flex w-full items-center gap-2 rounded-md border border-[--border] bg-[--background] px-2.5 py-2 text-left transition-colors hover:bg-[--surface] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-brand text-[10px] font-bold text-white">
              {(projectName ?? "P")[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate text-[12.5px] font-medium text-[--text-primary]">
              {projectName ?? projectId}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <ScrollArea className="flex-1 px-2 py-1">
        <nav className="flex flex-col gap-0.5">
          {groups.map((group, gi) => (
            <NavGroupSection
              key={gi}
              group={group}
              pathname={pathname}
              collapsed={collapsed}
              isAdmin={isAdmin}
              isFirst={gi === 0}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* ── Plan badge ── */}
      {!collapsed && !isAdmin && (
        <>
          <Separator className="bg-[--border]" />
          <div className="px-3 py-3 shrink-0">
            <div className="flex items-center justify-between rounded-lg border border-[--border] bg-[--background] px-3 py-2.5 gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold",
                      plan.className,
                    )}
                  >
                    {plan.label}
                  </span>
                  <span className="text-[11px] text-[--text-muted]">
                    {plan.price}
                  </span>
                </div>
                {orgPlan === "free" && (
                  <p className="text-[10.5px] text-[--text-muted] mt-0.5">
                    Limited to 3 projects
                  </p>
                )}
              </div>
              {orgPlan !== "pro" && (
                <Link
                  href="/overview/billing"
                  onClick={onNavigate}
                  className="flex shrink-0 items-center gap-0.5 rounded-full border border-brand/30 bg-[--sidebar-active] px-2.5 py-1 text-[11px] font-semibold text-[--sidebar-active-text] transition-colors hover:bg-brand hover:text-white hover:border-brand"
                >
                  Upgrade
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── User row ── */}
      <Separator className="bg-[--border]" />
      <UserRow
        user={user}
        initials={initials}
        collapsed={collapsed}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
      />

      {/* ── Desktop collapse toggle ── */}
      {onCollapse && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCollapse}
              className="absolute -right-[13px] top-[54px] z-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-[--border] bg-[--background] text-[--text-muted] shadow-sm transition-all hover:text-[--text-primary] hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ─── Main exported Sidebar ────────────────────────────────────────────────────

export function Sidebar({
  variant,
  user,
  projectId,
  projectName,
  orgPlan = "free",
  className,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const isAdmin = variant === "superadmin";

  const handleMobileNavigate = React.useCallback(() => {
    onMobileOpenChange?.(false);
  }, [onMobileOpenChange]);

  const sharedProps = {
    variant,
    user,
    projectId,
    projectName,
    orgPlan,
    isAdmin,
  };

  return (
    <TooltipProvider>
      {/* ── Mobile: Sheet drawer ── */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[260px] p-0 border-r border-[--border] bg-[--sidebar-bg]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <button
            onClick={() => onMobileOpenChange?.(false)}
            className="absolute right-3 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-md text-[--text-muted] hover:bg-[--surface] hover:text-[--text-primary] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent
            {...sharedProps}
            collapsed={false}
            onNavigate={handleMobileNavigate}
          />
        </SheetContent>
      </Sheet>

      {/* ── Desktop: fixed sidebar ── */}
      <aside
        className={cn(
          "relative hidden md:flex h-full flex-col bg-[--sidebar-bg] border-r border-[--border] transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-[60px]" : "w-[240px]",
          className,
        )}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>
    </TooltipProvider>
  );
}

// ─── NavGroupSection ──────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  pathname,
  collapsed,
  isAdmin,
  isFirst,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  isAdmin: boolean;
  isFirst: boolean;
  onNavigate?: () => void;
}) {
  const hasLabel = !!group.label;

  return (
    <div
      className={cn("flex flex-col gap-0.5", !isFirst && hasLabel && "mt-2")}
    >
      {hasLabel && !collapsed && (
        <p className="px-2 pb-0.5 pt-1 text-[10.5px] font-semibold uppercase tracking-widest text-[--text-muted]">
          {group.label}
        </p>
      )}
      {hasLabel && collapsed && !isFirst && (
        <div className="flex justify-center py-1">
          <div className="h-px w-5 bg-[--border]" />
        </div>
      )}
      {group.items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          isAdmin={isAdmin}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

// ─── SidebarNavItem ───────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  pathname,
  collapsed,
  isAdmin,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const isActive = !item.disabled && (
    item.matchExact
      ? pathname === item.href
      : pathname.startsWith(item.href) &&
        item.href !== "/overview" &&
        item.href !== "/superadmin"
  );

  const Icon = item.icon;

  const linkClass = cn(
    "group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2",
    isActive
      ? isAdmin
        ? "bg-[--admin-sidebar-active] text-[--admin-sidebar-active-text] font-medium focus-visible:ring-[--admin-brand]/40"
        : "bg-[--sidebar-active] text-[--sidebar-active-text] font-medium focus-visible:ring-brand/40"
      : item.disabled
        ? "text-[--text-muted] cursor-not-allowed opacity-60 focus-visible:ring-transparent"
        : "text-[--sidebar-text] hover:bg-[--surface-hover] hover:text-[--text-primary] focus-visible:ring-brand/40",
    collapsed && "justify-center px-0 w-8 mx-auto",
  );

  const iconClass = cn(
    "h-4 w-4 shrink-0 transition-colors",
    isActive
      ? isAdmin
        ? "text-[--admin-brand]"
        : "text-brand"
      : item.disabled
        ? "text-[--text-muted]"
        : "text-[--sidebar-icon] group-hover:text-[--text-primary]",
  );

  const inner = (
    <>
      <Icon className={iconClass} aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider leading-none",
                item.badgeVariant === "soon"
                  ? "bg-[--surface] text-[--text-muted] border border-[--border2]"
                  : item.badgeVariant === "new"
                    ? "bg-[--info-bg] text-[--info-text]"
                    : "bg-[--warn-bg] text-[--warn-text]",
              )}
            >
              {item.badge}
            </span>
          )}
          {item.external && (
            <ExternalLink
              className="h-3 w-3 text-[--text-muted]"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </>
  );

  // Disabled items render as a non-interactive div
  if (item.disabled) {
    const el = (
      <div className={linkClass} aria-disabled="true" role="presentation">
        {inner}
      </div>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{el}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-1.5">
            {item.label}
            <span className="rounded-full bg-[--surface] border border-[--border2] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[--text-muted]">
              soon
            </span>
          </TooltipContent>
        </Tooltip>
      );
    }
    return el;
  }

  // External link
  if (item.external) {
    const el = (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        onClick={onNavigate}
      >
        {inner}
      </a>
    );
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild><span>{el}</span></TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return el;
  }

  // Normal link
  const el = (
    <Link href={item.href} className={linkClass} onClick={onNavigate}>
      {inner}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild><span>{el}</span></TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-1.5">
          {item.label}
          {item.badge && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
              item.badgeVariant === "soon"
                ? "bg-[--surface] border border-[--border2] text-[--text-muted]"
                : "bg-[--info-bg] text-[--info-text]"
            )}>
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return el;
}

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
  user,
  initials,
  collapsed,
  isAdmin,
  onNavigate,
}: {
  user: User;
  initials: string;
  collapsed: boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const avatarEl = (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        isAdmin
          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
          : "bg-[--sidebar-active] text-[--sidebar-active-text]",
      )}
    >
      {initials}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex h-12 w-full items-center justify-center transition-colors hover:bg-[--surface]"
            aria-label="User menu"
          >
            {avatarEl}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{user.name ?? "User"}</p>
          <p className="text-[11px] text-[--text-muted]">{user.email}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-12 w-full items-center gap-2.5 px-3 transition-colors hover:bg-[--surface] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset">
        {avatarEl}
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-[12.5px] font-medium text-[--text-primary] leading-tight">
            {user.name ?? "User"}
          </p>
          <p className="truncate text-[11px] text-[--text-muted] leading-tight">
            {user.email}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={6}
        className="w-52"
      >
        <div className="px-2 py-1.5">
          <p className="text-[12.5px] font-medium text-[--text-primary]">
            {user.name ?? "User"}
          </p>
          <p className="text-[11px] text-[--text-muted] truncate">
            {user.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/overview/settings/profile"
            className="flex items-center gap-2 text-[13px] cursor-pointer"
            onClick={onNavigate}
          >
            <Settings className="h-3.5 w-3.5" />
            Account settings
          </Link>
        </DropdownMenuItem>
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/overview/billing"
              className="flex items-center gap-2 text-[13px] cursor-pointer"
              onClick={onNavigate}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-[13px] text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}