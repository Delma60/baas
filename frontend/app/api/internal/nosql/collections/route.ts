// frontend/app/api/internal/nosql/collections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const mongoDatabase = searchParams.get("mongo_database");

  if (!projectId || !mongoDatabase) {
    return NextResponse.json({ error: "Missing projectId or mongo_database" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}/nosql/collections?mongo_database=${encodeURIComponent(mongoDatabase)}`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.detail ?? "Failed" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}