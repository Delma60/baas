// frontend/app/api/internal/sql/tables/[table]/columns/[column]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; column: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, column } = await params;
  const { projectId, dbSchema } = await req.json();

  if (!projectId || !dbSchema) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}?db_schema=${encodeURIComponent(dbSchema)}`,
      {
        method: "DELETE",
        headers: { "x-internal-secret": INTERNAL_SECRET },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Failed to drop column" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}