"use client";
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
  return (
    <div className="flex h-screen overflow-hidden bg-bg3">
      <Sidebar
        userId={user?.id as string}
        projectId={currentProject?.id as string}
        currentProject={currentProject as Project}
        projects={projects as Project[]}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={user} projectName={currentProject?.name} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
