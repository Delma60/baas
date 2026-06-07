// frontend/app/api/internal/functions/[id]/test/route.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: functionId } = await params;
  const body = await req.json();
  const projectId = body.projectId;
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/functions/${functionId}/test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}