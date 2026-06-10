// frontend/components/layout/LayoutShell.tsx
/**
 * Server component — fetches initial notifications so the bell renders
 * with the correct badge count on first paint, then the client component
 * handles all subsequent interactions.
 */
import { User } from "next-auth";
import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Project, ProjectUsage } from "@/types/baas";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getNotifications, getUnreadCount } from "@/lib/api/notifications-client";
import { BillingOverview, PlanLimits } from "@/lib/api/billing-client";

export const LayoutShell = async ({
  children,
  user,
  currentProject,
  projects,
  billingOverview,
  planLimits
}: {
  children: React.ReactNode;
  user: User;
  currentProject?: Project;
  projects?: Project[];
  billingOverview:BillingOverview
  planLimits:PlanLimits[]
}) => {
  // Pre-fetch notifications for the initial render so there's no badge flicker
  let initialNotifications: Awaited<ReturnType<typeof getNotifications>>["notifications"] = [];
  let initialUnreadCount = 0;

  if (user?.id) {
    try {
      const [notifResult, unread] = await Promise.all([
        getNotifications(user.id, { limit: 20 }),
        getUnreadCount(user.id),
      ]);
      initialNotifications = notifResult.notifications;
      initialUnreadCount = unread;
    } catch {
      // Non-fatal — the client will refetch on popover open
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "220px",
          "--sidebar-width-icon": "3rem",
        } as React.CSSProperties
      }
    >
      <Sidebar
        userId={user?.id as string}
        projectId={currentProject?.id as string}
        currentProject={currentProject as Project}
        projects={projects as Project[]}
        billingOverview={billingOverview as BillingOverview}
        planLimits={planLimits}
      />

      <SidebarInset className="flex flex-col overflow-hidden min-w-0">
        <TopNav
          user={user}
          projectName={currentProject?.name}
          sidebarTrigger
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};