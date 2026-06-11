// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/layout.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectById, getProjectsByUser } from "@/lib/api/client";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Project, ProjectUsage } from "@/types/baas";
import { BillingOverview, getBillingOverview, getPlanLimits, getProjectUsageWithLimits } from "@/lib/api/billing-client";
import { APP_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: {
    template: `%s · ${APP_NAME}`,
    default: `Dashboard · ${APP_NAME}`,
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

  const [projectData, projectsData = [], billingOverview, planLimits] =
    await Promise.all([
      getProjectById(projectId).catch((err) => {
        console.error(
          `[ProjectLayout] getProjectById failed for projectId ${projectId}:`,
          err?.message ?? err,
        );
        redirect(`/u/${session.user.id}/projects`); // Redirect to projects list if project not found
      }),
      getProjectsByUser(session?.user?.id || "").catch((err) => {
        console.error(
          `[ProjectLayout] getProjectsByUser failed for userId ${session?.user?.id}:`,
          err?.message ?? err,
        );
        // Don't redirect here since we can still show the layout without the projects list
        return [];
      }),
      getBillingOverview(projectId).catch((err) => {
        console.error(
          `[ProjectLayout] getBillingOverview failed for projectId ${projectId}:`,
          err?.message ?? err,
        );
        return;
      }),
          getPlanLimits().catch(() => []),
      
    ]);

  return (
    <LayoutShell
      user={session.user}
      currentProject={projectData}
      projects={projectsData}
      billingOverview={billingOverview as unknown as BillingOverview}
      planLimits={planLimits}

    >
      {children}
    </LayoutShell>
  );
}
