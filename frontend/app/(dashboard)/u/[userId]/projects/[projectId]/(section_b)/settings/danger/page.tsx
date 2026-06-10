// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/danger/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DangerZoneClient } from "@/components/settings/DangerZoneClient";
import { getProjectById } from "@/lib/api/client";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Danger Zone · ${projectId}` };
}

export default async function DangerZonePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    redirect(`/u/${userId}`);
  }

  return (
    <DangerZoneClient
      projectId={projectId}
      userId={userId}
      projectName={project.name}
      projectStatus={project.status}
      dbSchema={project.db_schema}
      mongoDatabase={project.mongo_database}
    />
  );
}