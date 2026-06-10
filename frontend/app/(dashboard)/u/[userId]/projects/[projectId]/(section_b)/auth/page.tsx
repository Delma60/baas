// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/auth/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuthUsers, getAuthStats } from "@/lib/api/auth-client";
import { getAuthSettings, getEmailTemplates } from "@/lib/api/auth-settings-client";
import { getProjectById } from "@/lib/api/client";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

interface PageProps {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{
    tab?: string;
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 50;

export default async function AuthPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId, projectId } = await params;
  const { tab = "users", search = "", page = "1" } = await searchParams;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Fetch project to get dbSchema
  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    redirect(`/u/${userId}`);
  }

  const dbSchema = project.db_schema;

  // Fetch all data in parallel
  const [usersResult, statsResult, authSettingsResult, emailTemplatesResult] =
    await Promise.allSettled([
      getAuthUsers(projectId, dbSchema, {
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      }),
      getAuthStats(projectId, dbSchema),
      getAuthSettings(projectId),
      getEmailTemplates(projectId),
    ]);

  const usersData =
    usersResult.status === "fulfilled"
      ? usersResult.value
      : { users: [], total: 0 };

  const stats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : {
          total_users: 0,
          verified_users: 0,
          unverified_users: 0,
          new_last_30d: 0,
          new_last_7d: 0,
        };

  const authSettings =
    authSettingsResult.status === "fulfilled" ? authSettingsResult.value : null;

  const emailTemplates =
    emailTemplatesResult.status === "fulfilled"
      ? emailTemplatesResult.value
      : null;

  return (
    <AuthPageClient
      userId={userId}
      projectId={projectId}
      dbSchema={dbSchema}
      initialTab={tab}
      initialSearch={search}
      initialUsers={usersData.users}
      totalUsers={usersData.total}
      stats={stats}
      currentPage={currentPage}
      initialAuthSettings={authSettings}
      initialEmailTemplates={emailTemplates}
    />
  );
}