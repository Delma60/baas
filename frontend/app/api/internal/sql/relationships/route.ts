// frontend/app/api/internal/sql/relationships/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId") ?? "";
  const dbSchema = searchParams.get("db_schema") ?? "";

  if (!dbSchema) return NextResponse.json({ error: "Missing db_schema" }, { status: 400 });

  // We don't have projectId from query easily here, so derive from dbSchema prefix
  // The internal endpoint uses projectId from path — we need it
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/sql/relationships?db_schema=${encodeURIComponent(dbSchema)}`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.detail ?? "Failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}