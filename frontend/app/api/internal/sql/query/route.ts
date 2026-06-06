// frontend/app/api/internal/sql/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, dbSchema, query } = await req.json();

  if (!projectId || !dbSchema || !query) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/sql/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({ query, db_schema: dbSchema }),
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Query failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
} 