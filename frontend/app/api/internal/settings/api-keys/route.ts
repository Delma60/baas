// frontend/app/api/internal/settings/api-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function proxy(path: string, init: RequestInit) {
  const res = await fetch(`${FASTAPI_BASE_URL}/internal${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

// POST /api/internal/settings/api-keys  → create new key
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, key_type, label } = body;
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  return proxy(`/projects/${projectId}/api-keys`, {
    method: "POST",
    body: JSON.stringify({ key_type, label }),
  });
}