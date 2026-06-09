// frontend/app/api/internal/notifications/read-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

// POST /api/internal/notifications/read-all
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(
    `${FASTAPI_BASE_URL}/internal/notifications/read-all?user_id=${session.user.id}`,
    {
      method: "POST",
      headers: { "x-internal-secret": INTERNAL_SECRET },
      cache: "no-store",
    }
  );
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}