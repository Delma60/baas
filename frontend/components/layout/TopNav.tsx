// frontend/components/layout/TopNav.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, Menu, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "next-auth";
import { Button } from "../ui/button";

interface TopNavProps {
  user: User;
  title?: string;
  className?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function TopNav({
  user: _user,
  title,
  className,
  mobileOpen,
  onMobileOpenChange,
}: TopNavProps) {
  const router = useRouter();
  const [notifCount] = React.useState(2);

  return (
    <header
      className={cn(
        "flex h-[52px] flex-shrink-0 items-center gap-3 border-b border-[--border] bg-[--background] px-5",
        className,
      )}
    >
      {/* menu icon for sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMobileOpenChange?.(!mobileOpen)}
        className="lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* Page title slot — filled by individual pages via useContext or just left empty */}
      {title && (
        <h1 className="text-[15px] font-medium text-[--text-primary]">
          {title}
        </h1>
      )}

      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={() => {
          /* TODO: open global command palette */
        }}
        className="flex h-8 items-center gap-2 rounded-[8px] border border-[--border] bg-[--surface] px-3 text-sm text-[--text-muted] transition-colors hover:border-[--border2]"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden text-xs sm:block">Search projects…</span>
        <kbd className="hidden rounded border border-[--border] bg-[--bg3] px-1.5 py-0.5 text-[11px] text-[--text-muted] sm:block">
          ⌘K
        </kbd>
      </button>

      {/* Notification bell */}
      <button
        className="relative flex h-8 w-8 items-center justify-center rounded-[8px] text-[--text-secondary] transition-colors hover:bg-[--surface] hover:text-[--text-primary]"
        aria-label={`${notifCount} notifications`}
      >
        <Bell className="h-4 w-4" />
        {notifCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-brand" />
        )}
      </button>

      {/* Help */}
      <button
        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[--text-secondary] transition-colors hover:bg-[--surface] hover:text-[--text-primary]"
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* New project CTA */}
      <button
        onClick={() => router.push(`/u/${_user?.id}/projects/new`)}
        className="flex h-8 items-center gap-1.5 rounded-[8px] bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <Plus className="h-3.5 w-3.5" />
        New project
      </button>
    </header>
  );
}
