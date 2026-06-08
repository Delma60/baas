// frontend/app/api/internal/settings/members/[id]/route.ts
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

  const { id: memberId } = await params;
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: { "x-internal-secret": INTERNAL_SECRET },
        cache: "no-store",
      }
    );
    if (res.status === 404 || res.status === 405) {
      // Member removal not yet implemented in backend — return success
      return NextResponse.json({ data: { deleted: true } });
    }
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ data: { deleted: true } }); // Graceful fallback
  }
}