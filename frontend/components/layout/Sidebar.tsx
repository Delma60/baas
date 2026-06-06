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
  SheetTrigger,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  variant: "dashboard" | "superadmin";
  user: User;
  projectId?: string;
  projectName?: string;
  orgPlan?: "free" | "starter" | "pro";
  className?: string;
  /** Controlled open state for mobile sheet — provided by layout */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
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
          badge: "new",
          badgeVariant: "new",
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
    className: "text-muted-foreground",
    accent: "bg-muted text-muted-foreground",
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
    className: "text-violet-600 dark:text-violet-400",
    accent:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
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
  onNavigate?: () => void; // called on mobile to close the sheet
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
        "flex h-full flex-col bg-sidebar select-none overflow-hidden",
        !collapsed && "w-full",
      )}
    >
      {/* ── Logo / Header ── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border px-3 gap-2.5",
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
              isAdmin
                ? "bg-rose-600 dark:bg-rose-500"
                : "bg-violet-600 dark:bg-violet-500",
            )}
          >
            <Database className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-[13.5px] font-semibold tracking-tight text-foreground">
              {isAdmin ? "Superadmin" : "YourBaaS"}
            </span>
          )}
        </Link>

        {!collapsed && isAdmin && (
          <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
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
            <TooltipTrigger>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>
        ) : (
          <button className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search…</span>
            <kbd className="ml-auto hidden sm:block rounded border border-border bg-muted px-1 py-0.5 text-[10px] leading-none text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* ── Project switcher ── */}
      {!collapsed && !isAdmin && projectId && (
        <div className="mx-2 mb-1 shrink-0">
          <button className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-violet-600 dark:bg-violet-500 text-[10px] font-bold text-white">
              {(projectName ?? "P")[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate text-[12.5px] font-medium text-foreground">
              {projectName ?? projectId}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
          <Separator />
          <div className="px-3 py-3 shrink-0">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 gap-2">
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
                  <span className="text-[11px] text-muted-foreground">
                    {plan.price}
                  </span>
                </div>
                {orgPlan === "free" && (
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">
                    Limited to 3 projects
                  </p>
                )}
              </div>
              {orgPlan !== "pro" && (
                <Link
                  href="/overview/billing"
                  onClick={onNavigate}
                  className="flex shrink-0 items-center gap-0.5 rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-400 dark:hover:bg-violet-950"
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
      <Separator />
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
          <TooltipTrigger>
            <div
              onClick={onCollapse}
              className="absolute -right-[13px] top-[54px] z-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </div>
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
          className="w-[260px] p-0 border-r"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {/* Close button inside the sheet */}
          <button
            onClick={() => onMobileOpenChange?.(false)}
            className="absolute right-3 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
          "relative hidden md:flex h-full flex-col bg-sidebar border-r border-border transition-[width] duration-200 ease-in-out overflow-hidden",
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
        <p className="px-2 pb-0.5 pt-1 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {group.label}
        </p>
      )}
      {hasLabel && collapsed && !isFirst && (
        <div className="flex justify-center py-1">
          <div className="h-px w-5 bg-border" />
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
  const isActive = item.matchExact
    ? pathname === item.href
    : pathname.startsWith(item.href) &&
      item.href !== "/overview" &&
      item.href !== "/superadmin";

  const Icon = item.icon;

  const linkClass = cn(
    "group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive
      ? isAdmin
        ? "bg-rose-50 text-rose-700 font-medium dark:bg-rose-950/40 dark:text-rose-400"
        : "bg-violet-50 text-violet-700 font-medium dark:bg-violet-950/40 dark:text-violet-400"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
    collapsed && "justify-center px-0 w-8 mx-auto",
  );

  const iconClass = cn(
    "h-4 w-4 shrink-0 transition-colors",
    isActive
      ? isAdmin
        ? "text-rose-600 dark:text-rose-400"
        : "text-violet-600 dark:text-violet-400"
      : "text-muted-foreground group-hover:text-foreground",
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
                item.badgeVariant === "new"
                  ? "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
              )}
            >
              {item.badge}
            </span>
          )}
          {item.external && (
            <ExternalLink
              className="h-3 w-3 text-muted-foreground/50"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </>
  );

  const linkEl = item.external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
      onClick={onNavigate}
    >
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={linkClass} onClick={onNavigate}>
      {inner}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>{linkEl}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-1.5">
          {item.label}
          {item.badge && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkEl;
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
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
          : "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
      )}
    >
      {initials}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <button
            className="flex h-12 w-full items-center justify-center transition-colors hover:bg-accent"
            aria-label="User menu"
          >
            {avatarEl}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{user.name ?? "User"}</p>
          <p className="text-[11px] text-muted-foreground">{user.email}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex h-12 w-full items-center gap-2.5 px-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          {avatarEl}
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-[12.5px] font-medium text-foreground leading-tight">
              {user.name ?? "User"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight">
              {user.email}
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={6}
        className="w-52"
      >
        <div className="px-2 py-1.5">
          <p className="text-[12.5px] font-medium text-foreground">
            {user.name ?? "User"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link
            href="/overview/settings/profile"
            className="text-[13px] gap-2"
            onClick={onNavigate}
          >
            <Settings className="h-3.5 w-3.5" />
            Account settings
          </Link>
        </DropdownMenuItem>
        {!isAdmin && (
          <DropdownMenuItem>
            <Link
              href="/overview/billing"
              className="text-[13px] gap-2"
              onClick={onNavigate}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
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
