// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/layout.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { getProjectById } from "@/lib/api/client";

export const metadata: Metadata = {
  title: {
    template: "%s · YourBaaS",
    default: "Dashboard · YourBaaS",
  },
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string; projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;
  let projectName = projectId;

  // TODO: fetch real project name from DB/API
  try {
    const project = await getProjectById(projectId);
    
    projectName = project?.name || projectId; // fallback until real fetch
  } catch (error) {
    console.log(error);
    redirect(`/u/${session.user.id}/projects`); // Redirect to projects list if project not found
  }
    
  return (
    <div className="flex h-screen overflow-hidden bg-[--bg3]">
      <Sidebar
        variant="dashboard"
        user={session.user}
        projectId={projectId}
        projectName={projectName}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={session.user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}