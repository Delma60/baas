// frontend/components/layout/Sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  Users,
  CreditCard,
  BookOpen,
  Settings,
  Database,
  Plus,
  ChevronDown,
  ChevronUp,
  Building2,
  UserCog,
  Package,
  ClipboardList,
  ShieldAlert,
  Flag,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import type { User } from "next-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  variant: "dashboard" | "superadmin";
  user: User;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  matchExact?: boolean;
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const DASHBOARD_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, matchExact: true },
  { label: "Projects", href: "/dashboard/projects", icon: Folder },
  { label: "Members", href: "/dashboard/members", icon: Users },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

const DASHBOARD_BOTTOM: NavItem[] = [
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const SUPERADMIN_NAV: NavItem[] = [
  { label: "Metrics", href: "/superadmin", icon: BarChart3, matchExact: true },
  { label: "Users", href: "/superadmin/users", icon: UserCog },
  { label: "Organizations", href: "/superadmin/organizations", icon: Building2 },
  { label: "Projects", href: "/superadmin/projects", icon: Package },
  { label: "Billing", href: "/superadmin/billing", icon: CreditCard },
  { label: "Staff", href: "/superadmin/staff", icon: ShieldAlert },
  { label: "Audit log", href: "/superadmin/audit", icon: ClipboardList },
  { label: "Flags", href: "/superadmin/flags", icon: Flag },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ variant, user, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const isAdmin = variant === "superadmin";

  const primaryNav = isAdmin ? SUPERADMIN_NAV : DASHBOARD_NAV;
  const bottomNav = isAdmin ? [] : DASHBOARD_BOTTOM;

  const initials = getInitials(user.name ?? user.email ?? "U");

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-[--border] bg-[--sidebar-bg] transition-all duration-200",
        collapsed ? "w-16" : "w-56",
        className,
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-[52px] items-center gap-2.5 border-b border-[--border] px-3.5",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href={isAdmin ? "/superadmin" : "/dashboard"} className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]",
              isAdmin ? "bg-[--admin-brand]" : "bg-[--brand]",
            )}
          >
            <Database className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-[--text-primary]">
              {isAdmin ? "Superadmin" : "YourBaaS"}
            </span>
          )}
        </Link>
      </div>

      {/* Org switcher — dashboard only */}
      {!isAdmin && !collapsed && <OrgSwitcher orgName="Acme Corp" />}

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-3">
        {!collapsed && (
          <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-[--text-muted]">
            {isAdmin ? "Platform" : "Navigation"}
          </p>
        )}
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            variant={variant}
          />
        ))}
      </nav>

      {/* Bottom nav — dashboard only */}
      {bottomNav.length > 0 && (
        <>
          <div className="mx-2 h-px bg-[--border]" />
          <nav className="flex flex-col gap-0.5 px-2 py-3">
            {bottomNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                variant={variant}
              />
            ))}
          </nav>
        </>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-[70px] flex h-6 w-6 items-center justify-center rounded-full border border-[--border] bg-[--sidebar-bg] text-[--text-muted] shadow-sm transition-colors hover:text-[--text-primary]",
          "z-10",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-3 w-3" />
        ) : (
          <PanelLeftClose className="h-3 w-3" />
        )}
      </button>

      {/* User footer */}
      <div className="mt-auto border-t border-[--border] p-2">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-[--surface-hover]",
              collapsed && "justify-center px-0",
            )}
          >
            <UserAvatar initials={initials} size="sm" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[--text-primary]">
                    {user.name ?? "User"}
                  </p>
                  <p className="truncate text-[11px] text-[--text-muted]">
                    {user.email}
                  </p>
                </div>
                {userMenuOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-[--text-muted]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-[--text-muted]" />
                )}
              </>
            )}
          </button>

          {/* User dropdown */}
          {userMenuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-[8px] border border-[--border] bg-[--surface] py-1 shadow-md">
              <Link
                href="/dashboard/settings/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[--text-secondary] hover:bg-[--surface-hover]"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="h-3.5 w-3.5" />
                Account settings
              </Link>
              <div className="my-1 h-px bg-[--border]" />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[--text-secondary] hover:bg-[--surface-hover]"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
  variant,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  variant: "dashboard" | "superadmin";
}) {
  const isActive = item.matchExact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const isAdmin = variant === "superadmin";
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? isAdmin
            ? "bg-[--admin-sidebar-active] text-[--admin-sidebar-active-text]"
            : "bg-[--sidebar-active] text-[--sidebar-active-text]"
          : "text-[--sidebar-text] hover:bg-[--surface-hover] hover:text-[--text-primary]",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive
            ? isAdmin
              ? "text-[--admin-brand]"
              : "text-[--brand]"
            : "text-[--sidebar-icon]",
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge !== undefined && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            isActive
              ? isAdmin
                ? "bg-[--admin-brand]/20 text-[--admin-brand]"
                : "bg-[--brand]/20 text-[--brand]"
              : "bg-[--surface-hover] text-[--text-muted]",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function OrgSwitcher({ orgName }: { orgName: string }) {
  return (
    <div className="px-2 py-2">
      <button className="flex w-full items-center gap-2 rounded-[8px] border border-[--border] bg-[--bg3] px-2.5 py-2 text-left transition-colors hover:border-[--border2]">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] bg-[--brand] text-[10px] font-semibold text-white">
          {orgName[0]}
        </div>
        <span className="flex-1 truncate text-xs font-medium text-[--text-primary]">
          {orgName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-[--text-muted]" />
      </button>
    </div>
  );
}

export function UserAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-[--info-bg] font-medium text-[--info-text]",
        sizes[size],
      )}
    >
      {initials}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}