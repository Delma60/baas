// frontend/components/layout/TopNav.tsx
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AvatarComp } from "@/components/shared/AvatarComp";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { User } from "next-auth";
import type { Notification } from "@/lib/api/notifications-client";

interface TopNavProps {
  user: User;
  projectName?: string;
  sidebarTrigger?: boolean;
  /** Pre-fetched by the server layout */
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export function TopNav({
  user,
  projectName,
  initialNotifications = [],
  initialUnreadCount = 0,
}: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-3 md:px-4">
      {/* Left: sidebar trigger + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 text-text-muted hover:text-text-primary hover:bg-surface" />
        {projectName && (
          <>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-sm font-medium text-text-secondary truncate hidden sm:block">
              {projectName}
            </span>
          </>
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

        {/* Notification bell — client component with SSR initial state */}
        <NotificationBell
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
        />

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Avatar / user menu */}
        <AvatarComp user={user} />
      </div>
    </header>
  );
}