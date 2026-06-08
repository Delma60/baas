// frontend/app/api/internal/settings/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

// DELETE /api/internal/settings/delete?projectId=xxx&db_schema=xxx&mongo_database=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const dbSchema = searchParams.get("db_schema");
  const mongoDatabase = searchParams.get("mongo_database");

  if (!projectId || !dbSchema || !mongoDatabase) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}?db_schema=${encodeURIComponent(dbSchema)}&mongo_database=${encodeURIComponent(mongoDatabase)}`,
      {
        method: "DELETE",
        headers: { "x-internal-secret": INTERNAL_SECRET },
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}