// frontend/app/api/internal/notifications/route.ts
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
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

// GET  /api/internal/notifications?limit=&unread_only=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const params = new URLSearchParams({ user_id: session.user.id });
  if (sp.get("limit")) params.set("limit", sp.get("limit")!);
  if (sp.get("offset")) params.set("offset", sp.get("offset")!);
  if (sp.get("unread_only")) params.set("unread_only", sp.get("unread_only")!);

  return proxy(`/notifications?${params}`, { method: "GET" });
}