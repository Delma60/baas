'use client'
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
  const [onOpen, setOnOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-[--bg3]">
      <Sidebar
        variant="dashboard"
        user={user}
        projectId={currentProject?.id}
        projectName={currentProject?.name}
        mobileOpen={onOpen}
        onMobileOpenChange={setOnOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          user={user}
          mobileOpen={onOpen}
          onMobileOpenChange={setOnOpen}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
