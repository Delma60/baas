// frontend/components/layout/LayoutShell.tsx
"use client";

import { User } from "next-auth";
import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Project } from "@/types/baas";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const LayoutShell = ({
  children,
  user,
  currentProject,
  projects,
}: {
  children: React.ReactNode;
  user: User;
  currentProject?: Project;
  projects?: Project[];
}) => {
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
      />

      <SidebarInset className="flex flex-col overflow-hidden min-w-0">
        <TopNav
          user={user}
          projectName={currentProject?.name}
          // Pass the SidebarTrigger slot — TopNav renders it inside the header
          sidebarTrigger
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};