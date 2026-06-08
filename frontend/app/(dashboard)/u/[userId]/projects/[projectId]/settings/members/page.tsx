// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/members/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MembersClient } from "@/components/settings/MembersClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Members · ${projectId}` };
}

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function fetchMembers(projectId: string) {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/members`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.members ?? [];
  } catch {
    return [];
  }
}

export default async function MembersPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  const members = await fetchMembers(projectId);
  const currentUserId = session.user.id ?? "";

  return (
    <MembersClient
      projectId={projectId}
      userId={userId}
      initialMembers={members}
      currentUserId={currentUserId}
    />
  );
}