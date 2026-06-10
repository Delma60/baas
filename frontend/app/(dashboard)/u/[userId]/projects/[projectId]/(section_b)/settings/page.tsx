// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GeneralSettingsClient } from "@/components/settings/GeneralSettingsClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `General Settings · ${projectId}` };
}

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function fetchProjectSettings(projectId: string) {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/settings`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

const REGION_LABELS: Record<string, string> = {
  lagos: "Lagos, Nigeria (af-south-1)",
  london: "London, UK (eu-west-2)",
  singapore: "Singapore (ap-southeast-1)",
};

export default async function SettingsGeneralPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  const settings = await fetchProjectSettings(projectId);

  if (!settings) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center">
        <p className="text-sm text-text-muted">Failed to load project settings.</p>
      </div>
    );
  }

  return (
    <GeneralSettingsClient
      projectId={projectId}
      userId={userId}
      settings={settings}
      regionLabel={REGION_LABELS[settings.region] ?? settings.region}
    />
  );
}