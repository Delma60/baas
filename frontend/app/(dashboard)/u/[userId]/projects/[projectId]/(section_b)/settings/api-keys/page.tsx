// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/api-keys/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApiKeysClient } from "@/components/settings/ApiKeysClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `API Keys · ${projectId}` };
}

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function fetchApiKeys(projectId: string) {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/api-keys`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.keys ?? json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ApiKeysPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;
  const keys = await fetchApiKeys(projectId);

  return (
    <ApiKeysClient projectId={projectId} userId={userId} initialKeys={keys} />
  );
}
