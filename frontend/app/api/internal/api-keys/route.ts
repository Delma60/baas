// frontend/app/api/internal/api-keys/route.ts
// POST — create a new API key
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { project_id, key_type, label } = body;

  if (!project_id) return NextResponse.json({ error: "Missing project_id" }, { status: 400 });

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${project_id}/api-keys`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({ key_type: key_type ?? "anon", label }),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}