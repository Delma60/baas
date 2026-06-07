// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/functions/page.tsx
import type { Metadata } from "next";
import { getFunctions, getFunctionStats } from "@/lib/api/functions-client";
import { FunctionsPageClient } from "@/components/functions/FunctionsPageClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Edge Functions · ${projectId}` };
}

export default async function FunctionsPage({ params }: Props) {
  const { userId, projectId } = await params;

  const [functionsData, stats] = await Promise.all([
    getFunctions(projectId).catch(() => ({ functions: [], total: 0 })),
    getFunctionStats(projectId).catch(() => ({
      total: 0,
      active: 0,
      inactive: 0,
      total_invocations: 0,
    })),
  ]);

  return (
    <FunctionsPageClient
      projectId={projectId}
      userId={userId}
      initialFunctions={functionsData.functions}
      initialStats={stats}
    />
  );
}