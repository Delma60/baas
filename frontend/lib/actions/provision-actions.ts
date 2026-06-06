// frontend/lib/actions/provision-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export type ProvisionState = {
  error?: string;
  success?: boolean;
} | null;

export async function provisionProjectDatabase(
  _prev: ProvisionState,
  formData: FormData
): Promise<ProvisionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const projectId = formData.get("projectId") as string;
  const userId = formData.get("userId") as string;

  if (!projectId) return { error: "Missing project ID" };

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/provision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.detail ?? `Provisioning failed (HTTP ${res.status})` };
    }

    revalidatePath(`/u/${userId}/projects/${projectId}/database`);
    return { success: true };
  } catch (err) {
    return { error: "Cannot reach backend. Is it running?" };
  }
}

export async function getDbStatus(projectId: string): Promise<{
  db_provisioned: boolean;
  db_schema: string;
  mongo_database: string;
} | null> {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/db-status`,
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