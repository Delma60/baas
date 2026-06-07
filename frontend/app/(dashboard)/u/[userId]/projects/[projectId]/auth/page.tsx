// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/auth/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getAuthUsers, getAuthStats } from "@/lib/api/auth-client";
import { getAuthSettings, getEmailTemplates } from "@/lib/api/auth-settings-client";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ tab?: string; search?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Authentication · ${projectId}` };
}

export default async function AuthPage({ params, searchParams }: Props) {
  const { userId, projectId } = await params;
  const { tab = "users", search = "", page = "1" } = await searchParams;

  const project = await getProjectById(projectId);
  const dbSchema = (project as any).db_schema ?? "";
  const offset = (parseInt(page) - 1) * 50;

  const [usersResult, stats, authSettings, emailTemplates] = await Promise.all([
    getAuthUsers(projectId, dbSchema, { limit: 50, offset, search: search || undefined }).catch(() => ({
      users: [],
      total: 0,
    })),
    getAuthStats(projectId, dbSchema).catch(() => ({
      total_users: 0,
      verified_users: 0,
      unverified_users: 0,
      new_last_30d: 0,
      new_last_7d: 0,
    })),
    getAuthSettings(projectId).catch(() => null),
    getEmailTemplates(projectId).catch(() => null),
  ]);

  return (
    <AuthPageClient
      userId={userId}
      projectId={projectId}
      dbSchema={dbSchema}
      initialTab={tab}
      initialSearch={search}
      initialUsers={usersResult.users}
      totalUsers={usersResult.total}
      stats={stats}
      currentPage={parseInt(page)}
      initialAuthSettings={authSettings}
      initialEmailTemplates={emailTemplates}
    />
  );
}