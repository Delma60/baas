"use client";
// frontend/components/layout/LayoutShell.tsx
import { User } from "next-auth";
import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Project } from "@/types/baas";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg3">
      <Sidebar
        userId={user?.id as string}
        projectId={currentProject?.id as string}
        currentProject={currentProject as Project}
        projects={projects as Project[]}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav
          user={user}
          projectName={currentProject?.name}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};