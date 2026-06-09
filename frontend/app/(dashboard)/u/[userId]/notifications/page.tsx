// frontend/app/(dashboard)/u/[userId]/notifications/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getNotifications } from "@/lib/api/notifications-client";
import { NotificationsPageClient } from "@/components/shared/NotificationsPageClient";

export const metadata: Metadata = { title: "Notifications · YourBaaS" };

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string; filter?: string }>;
}

const PAGE_SIZE = 30;

export default async function NotificationsPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const { page = "1", filter = "all" } = await searchParams;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getNotifications(session.user.id, {
    limit: PAGE_SIZE,
    offset,
    unreadOnly: filter === "unread",
  }).catch(() => ({ notifications: [], total: 0 }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 sm:px-6 py-4 sm:py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10">
          <Bell className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h1 className="text-base font-medium text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary mt-0.5 hidden sm:block">
            Stay up to date with your projects and billing
          </p>
        </div>
      </div>

      <NotificationsPageClient
        userId={userId}
        initialNotifications={result.notifications}
        initialTotal={result.total}
        initialFilter={filter as "all" | "unread"}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}