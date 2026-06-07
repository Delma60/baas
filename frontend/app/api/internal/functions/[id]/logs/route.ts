// frontend/app/api/internal/functions/[functionId]/logs/route.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

interface Params {
  params: Promise<{ functionId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { functionId } = await params;
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const res = await fetch(
    `${FASTAPI_BASE_URL}/internal/projects/${projectId}/functions/${functionId}/logs`,
    {
      headers: { "x-internal-secret": INTERNAL_SECRET },
      cache: "no-store",
    }
  );
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}