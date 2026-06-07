// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { redirect } from "next/navigation";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Settings · ${projectId}` };
}

export default async function SettingsGeneralPage({ params }: Props) {
  const { userId, projectId } = await params;

  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    redirect(`/u/${userId}`);
  }

  return <GeneralSettingsForm project={project} userId={userId} />;
}