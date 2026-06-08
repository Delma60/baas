// frontend/app/api/internal/api-keys/[id]/route.ts
// DELETE — revoke an API key
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: keyId } = await params;

  // We need projectId to scope the revoke — pass it as query param
  const projectId = req.nextUrl.searchParams.get("projectId");

  try {
    const path = projectId
      ? `${FASTAPI_BASE_URL}/internal/projects/${projectId}/api-keys/${keyId}`
      : `${FASTAPI_BASE_URL}/internal/api-keys/${keyId}`;

    const res = await fetch(path, {
      method: "DELETE",
      headers: { "x-internal-secret": INTERNAL_SECRET },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}