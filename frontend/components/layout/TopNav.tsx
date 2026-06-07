// frontend/components/layout/TopNav.tsx
import Link from "next/link";
import { BookOpen, Bell, Menu } from "lucide-react";
import { AvatarComp } from "@/components/shared/AvatarComp";
import type { User } from "next-auth";

interface TopNavProps {
  user: User;
  projectName?: string;
  onMenuClick?: () => void;
}

export function TopNav({ user, projectName, onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {projectName && (
          <span className="text-sm font-medium text-text-secondary truncate">
            {projectName}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Docs */}
        <Link
          href="https://docs.yourbaas.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Documentation"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
        >
          <BookOpen className="h-4 w-4" />
        </Link>

        {/* Notifications */}
        <button
          title="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Avatar / user menu */}
        <AvatarComp user={user} />
      </div>
    </header>
  );
}