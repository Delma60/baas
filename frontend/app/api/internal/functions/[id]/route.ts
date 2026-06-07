// frontend/app/api/internal/functions/[id]/route.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function proxyToFastAPI(path: string, init: RequestInit) {
  const res = await fetch(`${FASTAPI_BASE_URL}/internal${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: functionId } = await params;
  const body = await req.json();
  const projectId = body.projectId;
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  return proxyToFastAPI(`/projects/${projectId}/functions/${functionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: functionId } = await params;
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  return proxyToFastAPI(`/projects/${projectId}/functions/${functionId}`, {
    method: "DELETE",
  });
}