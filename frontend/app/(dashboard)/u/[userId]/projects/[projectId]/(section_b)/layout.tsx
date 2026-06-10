// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/layout.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectById, getProjectsByUser } from "@/lib/api/client";
import { LayoutShell } from "@/components/layout/LayoutShell";

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
  let project;
  let projects;

  // TODO: fetch real project name from DB/API
  try {
    project = await getProjectById(projectId);
    projects = await getProjectsByUser(session?.user?.id || "");
  } catch (error) {
    console.log(error);
    redirect(`/u/${session.user.id}/projects`); // Redirect to projects list if project not found
  }

  return (
    <LayoutShell
      user={session.user}
      currentProject={project}
      projects={projects}
    >
      {children}
    </LayoutShell>
  );
}
